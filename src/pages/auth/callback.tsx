import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToSupabase } from "@/lib/supabase/sync";

const PENDING_KEY = "pending_session_id";

type Phase =
  | "exchanging"       // running auth code exchange + initial sync
  | "redirecting"      // sync ok, about to leave the page
  | "auth_error"       // code exchange failed
  | "sync_error";      // signed in, but sync to Supabase failed

// Handles the magic-link redirect. Exchanges the URL code for a session,
// then syncs the pending localStorage assessment (if any) to Supabase under
// the authenticated user. On success, redirects to /dashboard.
//
// On sync failure: keeps pending_session_id intact, surfaces an error with a
// Try Again button. The user can retry as many times as needed without
// re-running the magic-link flow.
//
// Auth params from Supabase can arrive as either ?code=... (PKCE) or a
// #access_token=... hash fragment. supabase-js auto-detects both; we
// additionally call exchangeCodeForSession explicitly when a code is present
// so the error path is reachable.
export default function AuthCallback() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [phase, setPhase] = useState<Phase>("exchanging");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const runSync = useCallback(async (): Promise<void> => {
    const pendingId =
      typeof window !== "undefined" ? localStorage.getItem(PENDING_KEY) : null;

    if (!pendingId) {
      // Nothing to sync — straight to dashboard.
      setPhase("redirecting");
      router.replace("/dashboard");
      return;
    }

    const result = await syncSessionToSupabase(pendingId, lang, {
      markCompleted: true,
    });

    if (!result.ok) {
      // Keep pending_session_id intact so the user can retry.
      console.warn("[auth/callback] sync failed:", result.error);
      setErrorDetail(result.error ?? "unknown");
      setPhase("sync_error");
      return;
    }

    // Success — clear the pending key and head to the dashboard.
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // localStorage disabled — irrelevant since sync already succeeded.
    }
    setPhase("redirecting");
    router.replace("/dashboard");
  }, [router, lang]);

  // Initial run: exchange code, then attempt sync.
  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const run = async () => {
      const supabase = createClient();

      const code =
        typeof router.query.code === "string" ? router.query.code : null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setErrorDetail(error.message);
          setPhase("auth_error");
          // Give the user a moment to see the error before bouncing to login.
          setTimeout(() => router.replace("/login"), 1800);
          return;
        }
      }

      // Confirm we now have a user.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      if (!cancelled) await runSync();
    };

    run();

    return () => {
      cancelled = true;
    };
    // runSync is stable per-language; rerunning if lang changes mid-flow is
    // intentional (would re-attempt with the new lang). router/router.isReady
    // captures the readiness flip.
  }, [router, router.isReady, runSync]);

  const handleRetry = async () => {
    setErrorDetail(null);
    setPhase("exchanging");
    await runSync();
  };

  const handleSkip = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
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
