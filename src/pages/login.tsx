import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";

export default function Login() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { user, loading } = useUser();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, send the user straight to the dashboard.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        data: { language_preference: lang },
      },
    });

    if (signInError) {
      setError(t.login.error_generic);
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  };

  return (
    <Layout title="Sign in">
      <Section spacing="spacious">
        {!sent ? (
          <>
            <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-6 leading-[1.15]">
              {t.login.title}
            </h1>

            <p className="text-ink-soft leading-[1.7] mb-10 max-w-prose">
              {t.login.subtitle}
            </p>

            <Card variant="elevated">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink mb-2"
                  >
                    {t.login.email_label}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t.login.email_placeholder}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-line-strong rounded-md bg-paper-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? t.login.submitting : t.login.submit}
                </Button>

                {error && (
                  <p
                    role="alert"
                    className="text-sm text-accent-deep bg-accent/[0.06] border border-accent/25 rounded-md px-4 py-3"
                  >
                    {error}
                  </p>
                )}
              </form>
            </Card>
          </>
        ) : (
          <Card variant="elevated">
            <h1 className="text-2xl md:text-3xl font-serif text-ink mb-5 leading-tight">
              {t.login.sent_title}
            </h1>
            <p className="text-ink-soft leading-[1.75]">
              {t.login.sent_body(email)}
            </p>
          </Card>
        )}
      </Section>
    </Layout>
  );
}
