import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";

export default function Finalize() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId = router.query.session_id;
    setHasSession(typeof sessionId === "string" && sessionId.length > 0);
  }, [router.isReady, router.query.session_id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <Layout title="Almost done">
      <Section spacing="spacious">
        {!submitted ? (
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
                    className="w-full px-4 py-3 border border-line-strong rounded-md bg-paper-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!hasSession}
                  className="w-full sm:w-auto"
                >
                  {t.finalize.submit}
                </Button>

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
              {t.finalize.done_title}
            </h1>
            <p className="text-ink-soft leading-[1.75]">
              {t.finalize.done_p1}
            </p>
            <p className="text-ink-mute leading-relaxed mt-6 text-sm italic">
              {t.finalize.done_p2}
            </p>
          </Card>
        )}
      </Section>
    </Layout>
  );
}
