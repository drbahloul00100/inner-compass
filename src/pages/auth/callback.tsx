import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToSupabase } from "@/lib/supabase/sync";

const PENDING_KEY = "pending_session_id";

// Handles the magic-link redirect. Exchanges the URL code for a session,
// then either:
//   - syncs a pending assessment (from localStorage) and redirects to
//     /preparing/[session_id], or
//   - redirects to /dashboard.
//
// Auth params from Supabase can arrive as either ?code=... (PKCE flow) or
// a #access_token=... hash fragment. supabase-js auto-detects both when the
// client is created with default detectSessionInUrl=true; we additionally
// call exchangeCodeForSession when a code is present so the flow is explicit
// and the error path is reachable.
export default function AuthCallback() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const run = async () => {
      const supabase = createClient();

      // If a code is in the query string, exchange it for a session.
      // (Hash-fragment flow is handled automatically by supabase-js.)
      const code =
        typeof router.query.code === "string" ? router.query.code : null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setErrorMessage(error.message);
          // Give the user a moment to see the error before bouncing to login.
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }
      }

      // Confirm we now have a user.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      // Pick up any pending assessment session and sync it.
      const pendingId =
        typeof window !== "undefined"
          ? localStorage.getItem(PENDING_KEY)
          : null;

      if (pendingId) {
        try {
          await syncSessionToSupabase(pendingId, lang, { markCompleted: true });
        } catch (e) {
          // Sync failed (network, RLS, etc.). localStorage stays as fallback.
          console.warn("[auth/callback] sync failed", e);
        }
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {
          // ignore
        }
        if (!cancelled) router.replace(`/preparing/${pendingId}`);
        return;
      }

      if (!cancelled) router.replace("/dashboard");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, lang]);

  return (
    <Layout hideNav hideFooter title="Signing in">
      <Section spacing="spacious">
        <div className="flex flex-col items-center text-center">
          <Spinner />
          <p className="text-ink-soft mt-6">{t.preparing.title}</p>
          {errorMessage && (
            <p className="text-sm text-accent-deep mt-4 max-w-sm">{errorMessage}</p>
          )}
        </div>
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
