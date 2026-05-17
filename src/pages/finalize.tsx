import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

// localStorage key used to remember which assessment session the user is
// finalizing across the magic-link round trip.
const PENDING_KEY = "pending_session_id";

// Hard-coded so it always matches the URL configured in Supabase's
// Authentication → URL Configuration → Redirect URLs allow-list. Using
// window.location.origin caused magic links to fail on preview URLs and
// localhost since those origins aren't allow-listed.
const MAGIC_LINK_REDIRECT = "https://innercompas.netlify.app/auth/callback";

export default function Finalize() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const queryId = router.query.session_id;
    if (typeof queryId === "string" && queryId.length > 0) {
      setSessionId(queryId);
      setHasSession(true);
    } else {
      setHasSession(false);
    }
  }, [router.isReady, router.query.session_id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !sessionId || submitting) return;

    setSubmitting(true);
    setError(null);

    // Persist the session id so the auth callback can pick it back up.
    // Also persist the language so the callback knows how to record it.
    try {
      localStorage.setItem(PENDING_KEY, sessionId);
    } catch {
      // localStorage may be disabled in private mode — continue anyway.
    }

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: MAGIC_LINK_REDIRECT,
        data: { language_preference: lang },
      },
    });

    if (signInError) {
      // Surface the real Supabase error so the user (and we, on a screenshot)
      // can see what went wrong instead of a generic message. Examples:
      // "Email rate limit exceeded", "Invalid email", "Signups not allowed",
      // "Redirect URL not in allow-list".
      // eslint-disable-next-line no-console
      console.error("[finalize] signInWithOtp error:", signInError);
      const detail = signInError.message || String(signInError);
      setError(`${t.finalize.error_generic} — ${detail}`);
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  };

  const handleResend = () => {
    setSent(false);
  };

  return (
    <Layout title="Almost done">
      <Section spacing="spacious">
        {!sent ? (
          <>
            <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-6 leading-[1.15]">
              {t.finalize.title}
            </h1>

            <p className="text-ink-soft leading-[1.7] mb-10 max-w-prose">
              {t.finalize.subtitle}
            </p>

            <Card variant="elevated">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink mb-2"
                  >
                    {t.finalize.email_label}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t.finalize.email_placeholder}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-line-strong rounded-md bg-paper-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!hasSession || submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? t.finalize.submitting : t.finalize.submit}
                </Button>

                {error && (
                  <p
                    role="alert"
                    className="text-sm text-accent-deep bg-accent/[0.06] border border-accent/25 rounded-md px-4 py-3"
                  >
                    {error}
                  </p>
                )}

                {!hasSession && (
                  <p className="text-sm text-ink-mute italic leading-relaxed">
                    {t.finalize.no_session}
                  </p>
                )}
              </form>
            </Card>
          </>
        ) : (
          <Card variant="elevated">
            <h1 className="text-2xl md:text-3xl font-serif text-ink mb-5 leading-tight">
              {t.finalize.sent_title}
            </h1>
            <p className="text-ink-soft leading-[1.75]">
              {t.finalize.sent_body(email)}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={handleResend}
                className="w-full sm:w-auto"
              >
                {t.finalize.sent_back}
              </Button>
            </div>
          </Card>
        )}
      </Section>
    </Layout>
  );
}
