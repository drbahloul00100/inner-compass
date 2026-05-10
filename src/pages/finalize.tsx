import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Finalize() {
  const router = useRouter();
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
              Receive your report
            </h1>

            <p className="text-ink-soft leading-relaxed mb-10">
              Enter your email to receive your personal Inner Compass report.
              Your responses are private; we will not send marketing.
            </p>

            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-line rounded-md bg-paper-card focus:outline-none focus:border-accent"
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" size="lg" disabled={!hasSession}>
                  Continue
                </Button>

                {!hasSession && (
                  <p className="text-sm text-ink-mute italic">
                    No assessment session detected. Please start the
                    assessment first.
                  </p>
                )}
              </form>
            </Card>
          </>
        ) : (
          <Card>
            <h1 className="text-2xl font-serif text-ink mb-4">
              You have completed Phase 1.
            </h1>
            <p className="text-ink-soft leading-relaxed">
              In Phase 2, this is where your account will be created and your
              report will be generated. For now, your assessment responses
              have been saved to this browser&apos;s local storage. Thank you
              for taking the assessment.
            </p>
            <p className="text-ink-mute leading-relaxed mt-6 text-sm italic">
              This page is a placeholder for the email-capture and scoring
              flow that will be built in Phase 2.
            </p>
          </Card>
        )}
      </section>
    </Layout>
  );
}
