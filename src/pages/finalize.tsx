import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
      <section className="max-w-reading mx-auto px-6 py-20">
        {!submitted ? (
          <>
            <h1 className="text-3xl md:text-4xl font-serif text-ink mb-6 leading-tight">
              {t.finalize.title}
            </h1>

            <p className="text-ink-soft leading-relaxed mb-10">
              {t.finalize.subtitle}
            </p>

            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-4 py-3 border border-line rounded-md bg-paper-card focus:outline-none focus:border-accent"
                  />
                </div>

                <Button type="submit" size="lg" disabled={!hasSession}>
                  {t.finalize.submit}
                </Button>

                {!hasSession && (
                  <p className="text-sm text-ink-mute italic">
                    {t.finalize.no_session}
                  </p>
                )}
              </form>
            </Card>
          </>
        ) : (
          <Card>
            <h1 className="text-2xl font-serif text-ink mb-4">
              {t.finalize.done_title}
            </h1>
            <p className="text-ink-soft leading-relaxed">
              {t.finalize.done_p1}
            </p>
            <p className="text-ink-mute leading-relaxed mt-6 text-sm italic">
              {t.finalize.done_p2}
            </p>
          </Card>
        )}
      </section>
    </Layout>
  );
}
