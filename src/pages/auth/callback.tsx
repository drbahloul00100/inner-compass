import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToSupabase } from "@/lib/supabase/sync";

const PENDING_KEY = "pending_session_id";

type Phase =
  | "exchanging" // running auth code exchange + initial sync
  | "redirecting" // sync ok, about to leave the page
  | "auth_error" // code exchange failed AND no session was established
  | "sync_error"; // signed in, but sync to Supabase failed

// Logger that mirrors to console and to the same localStorage debug bucket as
// sync.ts so the full timeline is captured in one place.
const DEBUG_KEY = "__inner_compass_sync_debug";
function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log("[CALLBACK]", ...args);
  try {
    if (typeof window === "undefined") return;
    const prev = window.localStorage.getItem(DEBUG_KEY) ?? "";
    const line = `${new Date().toISOString()} [CALLBACK] ${args
      .map((a) => (typeof a === "string" ? a : safe(a)))
      .join(" ")}`;
    const lines = (prev ? prev.split("\n") : []).concat(line).slice(-200);
    window.localStorage.setItem(DEBUG_KEY, lines.join("\n"));
  } catch {
    // ignore
  }
}
function safe(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// Handles the magic-link redirect. Exchanges the URL code for a session,
// then syncs the pending localStorage assessment (if any) to Supabase under
// the authenticated user. On success, redirects to /dashboard.
//
// On sync failure: keeps pending_session_id intact, surfaces an error with a
// Try Again button. The user can retry without re-running the magic-link flow.
export default function AuthCallback() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [phase, setPhase] = useState<Phase>("exchanging");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  // Guard against double-fire when lang flips during hydration causing the
  // effect to re-run with a fresh `runSync` reference.
  const startedRef = useRef(false);

  const runSync = useCallback(async (): Promise<void> => {
    let pendingId: string | null = null;
    try {
      pendingId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(PENDING_KEY)
          : null;
    } catch (e) {
      log("localStorage read for PENDING_KEY threw:", e);
    }
    log("runSync pendingId from localStorage:", pendingId);

    if (!pendingId) {
      log("no pendingId — nothing to sync, going to /dashboard");
      setPhase("redirecting");
      router.replace("/dashboard");
      return;
    }

    log("invoking syncSessionToSupabase…");
    const result = await syncSessionToSupabase(pendingId, lang, {
      markCompleted: true,
    });
    log("sync result:", result);

    if (!result.ok) {
      // Keep pending_session_id intact so the user can retry.
      // eslint-disable-next-line no-console
      console.warn("[CALLBACK] sync failed:", result.error);
      setErrorDetail(result.error ?? "unknown");
      setPhase("sync_error");
      return;
    }

    // Success — clear the pending key and head to the dashboard.
    try {
      window.localStorage.removeItem(PENDING_KEY);
      log("cleared PENDING_KEY");
    } catch (e) {
      log("PENDING_KEY removal threw (non-fatal):", e);
    }
    setPhase("redirecting");
    router.replace("/dashboard");
  }, [router, lang]);

  // Initial run: exchange code, then attempt sync. Runs ONCE per page mount.
  useEffect(() => {
    if (!router.isReady) return;
    if (startedRef.current) {
      log("effect re-fired (likely lang hydration) — already started, skipping");
      return;
    }
    startedRef.current = true;

    let cancelled = false;

    const run = async () => {
      log("=== auth/callback mounted ===");
      log("window.location.href:", typeof window !== "undefined" ? window.location.href : "(ssr)");
      log("router.query:", router.query);
      log("active lang:", lang);

      const supabase = createClient();

      const code =
        typeof router.query.code === "string" ? router.query.code : null;
      log("code param in URL:", code ? `present (len=${code.length})` : "absent");

      if (code) {
        log("calling exchangeCodeForSession…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Defensive: supabase-js's createBrowserClient enables
          // detectSessionInUrl by default and may have already consumed the
          // code at instantiation time. If that happened, exchangeCodeForSession
          // will fail — but getUser() will still return a valid user.
          // Only treat this as auth_error if we genuinely have no session.
          log("exchangeCodeForSession error:", error);
          const { data: { user: existingUser } } = await supabase.auth.getUser();
          if (!existingUser) {
            log("FAIL auth_error — no existing session either");
            if (!cancelled) {
              setErrorDetail(error.message);
              setPhase("auth_error");
              setTimeout(() => router.replace("/login"), 1800);
            }
            return;
          }
          log("recovered — supabase-js had already established a session for user", existingUser.id);
        } else {
          log("exchangeCodeForSession ok");
        }
      }

      // Confirm we now have a user.
      log("auth.getUser()…");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) log("getUser error:", userError);
      log("user:", user ? { id: user.id, email: user.email } : "null");

      if (!user) {
        log("no user after auth, redirecting to /login");
        if (!cancelled) router.replace("/login");
        return;
      }

      if (!cancelled) {
        log("user resolved, calling runSync");
        await runSync();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, runSync, lang]);

  const handleRetry = async () => {
    log("user clicked Try Again");
    setErrorDetail(null);
    setPhase("exchanging");
    await runSync();
  };

  const handleSkip = () => {
    log("user clicked Skip to Dashboard — clearing pending key and going");
    try {
      window.localStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    setPhase("redirecting");
    router.replace("/dashboard");
  };

  return (
    <Layout hideNav hideFooter title="Signing in">
      <Section spacing="spacious">
        {phase === "exchanging" || phase === "redirecting" ? (
          <div className="flex flex-col items-center text-center">
            <Spinner />
            <p className="text-ink-soft mt-6">{t.preparing.title}</p>
          </div>
        ) : phase === "auth_error" ? (
          <div className="flex flex-col items-center text-center">
            <p className="text-ink-soft mb-2">{t.callback.auth_error_title}</p>
            {errorDetail && (
              <p className="text-sm text-accent-deep mt-2 max-w-sm">
                {errorDetail}
              </p>
            )}
          </div>
        ) : (
          // sync_error
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-serif text-ink mb-3 leading-tight">
              {t.callback.sync_error_title}
            </h1>
            <p className="text-ink-soft leading-relaxed mb-6">
              {t.callback.sync_error_body}
            </p>
            {errorDetail && (
              <p className="text-xs text-ink-mute font-mono bg-paper-veil border border-line rounded-md px-3 py-2 mb-6 break-all">
                {errorDetail}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRetry} className="w-full sm:w-auto">
                {t.callback.sync_retry}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full sm:w-auto"
              >
                {t.callback.skip_to_dashboard}
              </Button>
            </div>
          </div>
        )}
      </Section>
    </Layout>
  );
}

function Spinner() {
  return (
    <div
      aria-hidden
      className="h-8 w-8 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
    />
  );
}
