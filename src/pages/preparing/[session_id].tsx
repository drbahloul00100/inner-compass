import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { getSession } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

const FREE_TEXT_ITEM_ID = 32;

type Phase = "running" | "redirecting" | "error";

// Phase 3 entry point. Reads the assessment responses from localStorage,
// POSTs them to the server-side scoring Netlify Function, persists the
// returned scoring JSON into Supabase, then redirects to /report/[id].
//
// localStorage stays the source of truth for the responses themselves.
// We never send item #32 to the server (the function would drop it anyway,
// but we filter here as defense in depth).
export default function Preparing() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("running");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  // Single-fire guard so the effect doesn't re-trigger scoring twice on
  // language hydration / router param changes.
  const startedRef = useRef(false);

  const runScoring = useCallback(async (sessionId: string): Promise<void> => {
    setErrorDetail(null);
    setPhase("running");

    const local = getSession(sessionId);
    if (!local) {
      setErrorDetail(t.preparing.error_no_session);
      setPhase("error");
      return;
    }

    // Build payload — strip item 32 here too. The server filters again.
    const payload: Record<string, { answer: unknown }> = {};
    for (const [id, r] of Object.entries(local.responses)) {
      const numId = parseInt(id, 10);
      if (!Number.isFinite(numId) || numId === FREE_TEXT_ITEM_ID) continue;
      payload[id] = { answer: r.answer };
    }

    let scoringJson: unknown;
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });
      if (!res.ok) {
        const body = await res.text();
        // eslint-disable-next-line no-console
        console.warn("[preparing] /api/score not ok:", res.status, body);
        setErrorDetail(`score_api: ${res.status} ${body.slice(0, 200)}`);
        setPhase("error");
        return;
      }
      scoringJson = await res.json();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn("[preparing] fetch error:", detail);
      setErrorDetail(`network: ${detail}`);
      setPhase("error");
      return;
    }

    // Persist into Supabase. Upsert on session_id so retries are idempotent.
    const sc = scoringJson as {
      engine_version?: string;
      primary_signature?: string | null;
      primary_driver?: string | null;
      primary_pattern?: string | null;
      validity_confidence?: string | null;
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("scoring_results")
        .upsert(
          {
            session_id: sessionId,
            engine_version: sc.engine_version ?? "inner_compass_scoring_v1.1",
            scoring_json: scoringJson,
            primary_signature: sc.primary_signature ?? null,
            primary_driver: sc.primary_driver ?? null,
            primary_pattern: sc.primary_pattern ?? null,
            validity_confidence: sc.validity_confidence ?? null,
            scored_at: new Date().toISOString(),
          },
          { onConflict: "session_id" }
        );

      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[preparing] scoring_results upsert error:", error);
        setErrorDetail(`db: ${error.message}`);
        setPhase("error");
        return;
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn("[preparing] db error:", detail);
      setErrorDetail(`db: ${detail}`);
      setPhase("error");
      return;
    }

    setPhase("redirecting");
    router.replace(`/report/${encodeURIComponent(sessionId)}`);
  }, [router, t.preparing.error_no_session]);

  useEffect(() => {
    if (!router.isReady) return;
    if (startedRef.current) return;
    const rawId = router.query.session_id;
    const sessionId = typeof rawId === "string" ? rawId : null;
    if (!sessionId) return;

    startedRef.current = true;
    runScoring(sessionId);
  }, [router.isReady, router.query.session_id, runScoring]);

  const sessionId =
    typeof router.query.session_id === "string"
      ? router.query.session_id
      : null;

  const handleRetry = () => {
    if (!sessionId) return;
    runScoring(sessionId);
  };

  const handleSkip = () => {
    router.replace("/dashboard");
  };

  return (
    <Layout hideNav hideFooter title="Preparing">
      <Section spacing="spacious">
        {phase === "running" || phase === "redirecting" ? (
          <div className="flex flex-col items-center text-center">
            <div
              aria-hidden
              className="h-10 w-10 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
            />
            <h1 className="text-2xl md:text-[1.75rem] font-serif text-ink mt-6 mb-2 leading-tight">
              {t.preparing.title}
            </h1>
            <p className="text-ink-mute">{t.preparing.subtitle}</p>
          </div>
        ) : (
          // error
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-serif text-ink mb-3 leading-tight">
              {t.preparing.error_title}
            </h1>
            <p className="text-ink-soft leading-relaxed mb-6">
              {t.preparing.error_body}
            </p>
            {errorDetail && (
              <p className="text-xs text-ink-mute font-mono bg-paper-veil border border-line rounded-md px-3 py-2 mb-6 break-all">
                {errorDetail}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRetry} className="w-full sm:w-auto">
                {t.preparing.error_retry}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full sm:w-auto"
              >
                {t.preparing.error_skip}
              </Button>
            </div>
          </div>
        )}
      </Section>
    </Layout>
  );
}
