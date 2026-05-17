import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  SIGNATURE_AR,
  DRIVER_AR,
  PATTERN_AR,
  VALIDITY_AR,
  localize,
  localizeBand,
  prettify,
} from "@/lib/reportLabels";

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

interface SignatureView {
  score: number;
  band: string;
}
interface DriverView {
  intensity: { score: number; band: string };
  regulation: { score: number; band: string };
}
interface PatternView {
  match: number;
  band: string;
}

interface ScoringJson {
  engine_version?: string;
  scored_at?: string;
  primary_signature?: string | null;
  primary_driver?: string | null;
  primary_pattern?: string | null;
  validity_confidence?: string | null;
  signatures?: Record<string, SignatureView>;
  drivers?: Record<string, DriverView>;
  patterns?: Record<string, PatternView>;
}

interface ScoringRow {
  session_id: string;
  engine_version: string;
  scoring_json: ScoringJson;
  primary_signature: string | null;
  primary_driver: string | null;
  primary_pattern: string | null;
  validity_confidence: string | null;
  scored_at: string;
  report_text: string | null;
  report_generated_at: string | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const BG_FUNCTION_URL = "/.netlify/functions/generate-report-background";
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export default function ReportPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [row, setRow] = useState<ScoringRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Polling control — uses refs so cleanup works even when state updates
  // race with the interval callback.
  const pollIntervalRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = () => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Initial load.
  useEffect(() => {
    if (!router.isReady) return;
    const rawId = router.query.session_id;
    const sessionId = typeof rawId === "string" ? rawId : null;
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("scoring_results")
        .select(
          "session_id, engine_version, scoring_json, primary_signature, primary_driver, primary_pattern, validity_confidence, scored_at, report_text, report_generated_at"
        )
        .eq("session_id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setRow(data as ScoringRow);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.session_id]);

  // Cleanup polling on unmount.
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // ---- Generate (fire-and-poll) -----------------------------------------
  const handleGenerate = async () => {
    if (!row || generating) return;
    setGenerating(true);
    setGenerateError(null);

    // Kick off the background job.
    try {
      const res = await fetch(BG_FUNCTION_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          session_id: row.session_id,
          scoring_json: row.scoring_json,
          language: lang,
        }),
      });
      // Background functions respond 202 Accepted immediately. Anything else
      // (4xx/5xx) means we couldn't even start the job — surface to user.
      if (res.status !== 202 && !res.ok) {
        const text = await res.text().catch(() => "");
        // eslint-disable-next-line no-console
        console.warn("[report] background fn rejected:", res.status, text);
        setGenerateError(`${res.status} ${text.slice(0, 200)}`);
        setGenerating(false);
        return;
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn("[report] background fn fetch error:", detail);
      setGenerateError(detail);
      setGenerating(false);
      return;
    }

    // Start polling scoring_results for the saved report_text.
    pollStartRef.current = Date.now();
    pollIntervalRef.current = window.setInterval(async () => {
      // Hard cap so we don't poll forever.
      if (Date.now() - pollStartRef.current > POLL_MAX_DURATION_MS) {
        stopPolling();
        setGenerateError("timeout_waiting_for_report");
        setGenerating(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("scoring_results")
          .select("report_text, report_generated_at")
          .eq("session_id", row.session_id)
          .maybeSingle();

        if (error) return; // keep polling; transient errors aren't fatal
        if (data && data.report_text) {
          stopPolling();
          setRow((prev) =>
            prev
              ? {
                  ...prev,
                  report_text: data.report_text as string,
                  report_generated_at:
                    (data.report_generated_at as string | null) ?? null,
                }
              : prev
          );
          setGenerating(false);
        }
      } catch {
        // Continue polling on transient errors.
      }
    }, POLL_INTERVAL_MS);
  };

  const handleCopy = async () => {
    if (!row?.report_text) return;
    try {
      await navigator.clipboard.writeText(row.report_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[report] copy failed:", e);
    }
  };

  // ---- Render -----------------------------------------------------------

  if (loading) {
    return (
      <Layout title="Report">
        <Section spacing="spacious">
          <p className="text-ink-mute">{t.report.loading}</p>
        </Section>
      </Layout>
    );
  }

  if (notFound || !row) {
    return (
      <Layout title="Report">
        <Section spacing="spacious">
          <p className="text-ink-mute mb-6">{t.report.not_found}</p>
          <Link href="/dashboard">
            <Button>{t.report.back_to_dashboard}</Button>
          </Link>
        </Section>
      </Layout>
    );
  }

  const json = row.scoring_json ?? {};
  const signatures = json.signatures ?? {};
  const drivers = json.drivers ?? {};
  const patterns = json.patterns ?? {};

  const noneLabel = t.report.none;

  const primarySignatureLabel = localize(row.primary_signature, SIGNATURE_AR, lang, noneLabel);
  const primaryDriverLabel = localize(row.primary_driver, DRIVER_AR, lang, noneLabel);
  const primaryPatternLabel = localize(row.primary_pattern, PATTERN_AR, lang, noneLabel);
  const validityLabel = localize(row.validity_confidence, VALIDITY_AR, lang, noneLabel);

  return (
    <Layout title="Report">
      <Section spacing="spacious">
        <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-3 leading-[1.15]">
          {t.report.title}
        </h1>
        <p className="text-ink-soft leading-[1.7] mb-12 md:mb-14 max-w-prose">
          {t.report.subtitle}
        </p>

        {/* Primary stats — 2x2 on mobile, 1x4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-16">
          <SummaryCard
            label={t.report.primary_signature_label}
            value={primarySignatureLabel}
          />
          <SummaryCard
            label={t.report.primary_driver_label}
            value={primaryDriverLabel}
          />
          <SummaryCard
            label={t.report.primary_pattern_label}
            value={primaryPatternLabel}
          />
          <SummaryCard
            label={t.report.validity_label}
            value={validityLabel}
          />
        </div>

        {/* Signatures */}
        <section className="mb-16">
          <SectionHeader>{t.report.signatures_section_title}</SectionHeader>
          <ul className="border-t border-line">
            {Object.entries(signatures).map(([name, s]) => (
              <ScoreRow
                key={name}
                label={localize(name, SIGNATURE_AR, lang, prettify(name))}
                score={s.score}
                band={localizeBand(s.band, lang)}
              />
            ))}
          </ul>
        </section>

        {/* Drivers */}
        <section className="mb-16">
          <SectionHeader>{t.report.drivers_section_title}</SectionHeader>
          <ul className="space-y-4">
            {Object.entries(drivers).map(([name, d]) => (
              <li
                key={name}
                className="border border-line bg-paper-card rounded-md p-5 md:p-6"
              >
                <div className="text-base md:text-lg font-medium text-ink mb-5 leading-snug">
                  {localize(name, DRIVER_AR, lang, prettify(name))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8">
                  <SubMetric
                    label={t.report.intensity_label}
                    score={d.intensity.score}
                    band={localizeBand(d.intensity.band, lang)}
                  />
                  <SubMetric
                    label={t.report.regulation_label}
                    score={d.regulation.score}
                    band={localizeBand(d.regulation.band, lang)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Patterns */}
        <section className="mb-12">
          <SectionHeader>{t.report.patterns_section_title}</SectionHeader>
          <ul className="border-t border-line">
            {Object.entries(patterns).map(([name, p]) => (
              <ScoreRow
                key={name}
                label={localize(name, PATTERN_AR, lang, prettify(name))}
                score={Math.round(p.match * 100)}
                band={localizeBand(p.band, lang)}
              />
            ))}
          </ul>
        </section>

        {/* Phase 4: full written report section */}
        <section className="mb-12 border-t border-line pt-12">
          {row.report_text ? (
            <GeneratedReport
              text={row.report_text}
              wordCount={countWords(row.report_text)}
              wordsLabel={t.report.report_meta}
              sectionTitle={t.report.report_section_title}
              copyLabel={t.report.copy_button}
              copiedLabel={t.report.copied}
              printLabel={t.report.print_button}
              printHref={`/report/${encodeURIComponent(row.session_id)}/print`}
              copied={copied}
              onCopy={handleCopy}
            />
          ) : (
            <GeneratePrompt
              title={t.report.generate_section_title}
              intro={t.report.generate_intro}
              buttonLabel={t.report.generate_button}
              generatingLabel={t.report.generating}
              generatingBackgroundLabel={t.report.generating_background}
              errorLabel={t.report.generate_error}
              generating={generating}
              error={generateError}
              onGenerate={handleGenerate}
            />
          )}
        </section>

        <Link href="/dashboard">
          <Button variant="ghost">{t.report.back_to_dashboard}</Button>
        </Link>
      </Section>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-serif text-ink mb-6 leading-tight">
      {children}
    </h2>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border border-line bg-paper-card rounded-md p-5 md:p-6 min-h-[120px]">
      <div className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-3">
        {label}
      </div>
      <div
        className="text-lg md:text-xl font-serif text-ink leading-snug flex-1 break-words"
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  score,
  band,
}: {
  label: string;
  score: number;
  band: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <li className="flex items-center gap-3 md:gap-5 py-4 border-b border-line last:border-b-0">
      <span className="flex-1 min-w-0 text-sm md:text-base text-ink font-medium truncate">
        {label}
      </span>
      <div className="hidden sm:block w-32 md:w-48 lg:w-64 shrink-0">
        <div className="h-1.5 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-accent/60 rounded-full"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-wider text-ink-mute w-20 md:w-28 text-end truncate shrink-0">
        {band}
      </span>
      <span className="text-sm text-ink tabular-nums w-10 text-end shrink-0">
        {score}
      </span>
    </li>
  );
}

function SubMetric({
  label,
  score,
  band,
}: {
  label: string;
  score: number;
  band: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
          {label}
        </span>
        <span className="text-sm text-ink tabular-nums font-medium">
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-accent/70 rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-[11px] uppercase tracking-wider text-ink-mute">
        {band}
      </div>
    </div>
  );
}

function GeneratePrompt({
  title,
  intro,
  buttonLabel,
  generatingLabel,
  generatingBackgroundLabel,
  errorLabel,
  generating,
  error,
  onGenerate,
}: {
  title: string;
  intro: string;
  buttonLabel: string;
  generatingLabel: string;
  generatingBackgroundLabel: string;
  errorLabel: string;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-serif text-ink mb-3 leading-tight">
        {title}
      </h2>
      <p className="text-ink-soft leading-relaxed mb-6 max-w-prose">{intro}</p>

      {generating ? (
        <div className="flex items-start gap-4 max-w-prose">
          <div
            aria-hidden
            className="h-5 w-5 mt-0.5 shrink-0 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
          />
          <p className="text-sm text-ink-soft leading-relaxed">
            {generatingBackgroundLabel || generatingLabel}
          </p>
        </div>
      ) : (
        <Button onClick={onGenerate} size="lg" className="w-full sm:w-auto">
          {buttonLabel}
        </Button>
      )}

      {error && !generating && (
        <div className="mt-5 max-w-prose">
          <p
            role="alert"
            className="text-sm text-accent-deep bg-accent/[0.06] border border-accent/25 rounded-md px-4 py-3"
          >
            {errorLabel}
          </p>
          <p className="text-xs text-ink-mute font-mono break-all mt-2 opacity-70">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

function GeneratedReport({
  text,
  wordCount,
  wordsLabel,
  sectionTitle,
  copyLabel,
  copiedLabel,
  printLabel,
  printHref,
  copied,
  onCopy,
}: {
  text: string;
  wordCount: number;
  wordsLabel: (n: number) => string;
  sectionTitle: string;
  copyLabel: string;
  copiedLabel: string;
  printLabel: string;
  printHref: string;
  copied: boolean;
  onCopy: () => void;
}) {
  // Split on blank lines; render `## Header` blocks as section headers,
  // everything else as paragraphs.
  const blocks = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-ink leading-tight mb-1">
            {sectionTitle}
          </h2>
          <p className="text-xs text-ink-mute">{wordsLabel(wordCount)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={onCopy}>
            {copied ? copiedLabel : copyLabel}
          </Button>
          <a href={printHref} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">{printLabel}</Button>
          </a>
        </div>
      </div>

      <article className="bg-paper-card border border-line rounded-md p-6 md:p-10">
        <div className="space-y-5 text-ink-soft leading-[1.85] text-[1.0625rem]">
          {blocks.map((block, i) => {
            if (block.startsWith("## ")) {
              return (
                <h3
                  key={i}
                  className="text-lg md:text-xl font-serif text-ink mt-6 mb-1 first:mt-0 leading-snug"
                >
                  {block.slice(3).trim()}
                </h3>
              );
            }
            return (
              <p key={i} className="whitespace-pre-line">
                {block}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
