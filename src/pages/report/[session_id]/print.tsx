import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
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

// Print-friendly report page. Standalone — does NOT use Layout (no nav,
// no footer). Designed to be opened in a new tab from the main report
// page, then printed via the browser's Print → Save as PDF flow.
//
// Tailwind's `print:` variant handles the print-vs-screen styling:
//   - Toolbar (back link + print button) hides under @media print
//   - Background flips to plain white; text dark
//   - Padding tightens for A4

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
  signatures?: Record<string, SignatureView>;
  drivers?: Record<string, DriverView>;
  patterns?: Record<string, PatternView>;
}

interface ScoringRow {
  session_id: string;
  scoring_json: ScoringJson;
  primary_signature: string | null;
  primary_driver: string | null;
  primary_pattern: string | null;
  validity_confidence: string | null;
  scored_at: string;
  report_text: string | null;
  report_generated_at: string | null;
}

export default function PrintReportPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [row, setRow] = useState<ScoringRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          "session_id, scoring_json, primary_signature, primary_driver, primary_pattern, validity_confidence, scored_at, report_text, report_generated_at"
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

  const sessionId =
    typeof router.query.session_id === "string"
      ? router.query.session_id
      : "";

  if (loading) {
    return (
      <PrintShell sessionId={sessionId} t={t}>
        <p className="text-ink-mute">{t.print.loading}</p>
      </PrintShell>
    );
  }

  if (notFound || !row) {
    return (
      <PrintShell sessionId={sessionId} t={t}>
        <p className="text-ink-mute">{t.print.not_found}</p>
      </PrintShell>
    );
  }

  const signatures = row.scoring_json?.signatures ?? {};
  const drivers = row.scoring_json?.drivers ?? {};
  const noneLabel = "—";
  const generatedAt =
    row.report_generated_at ?? row.scored_at;

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(
        lang === "ar" ? "ar" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
    } catch {
      return iso;
    }
  };

  const primarySignatureLabel = localize(row.primary_signature, SIGNATURE_AR, lang, noneLabel);
  const primaryDriverLabel = localize(row.primary_driver, DRIVER_AR, lang, noneLabel);
  const primaryPatternLabel = localize(row.primary_pattern, PATTERN_AR, lang, noneLabel);
  const validityLabel = localize(row.validity_confidence, VALIDITY_AR, lang, noneLabel);

  // Parse the report into blocks: `## Header` and regular paragraphs.
  const blocks = row.report_text
    ? row.report_text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

  return (
    <PrintShell sessionId={sessionId} t={t}>
      <article className="text-ink">
        {/* Header */}
        <header className="mb-10 pb-6 border-b border-line print:mb-6 print:pb-4">
          <h1 className="text-3xl md:text-4xl font-serif text-ink mb-2 leading-tight">
            {t.print.title}
          </h1>
          <p className="text-sm text-ink-mute">
            {t.print.generated_label}: {formatDate(generatedAt)}
          </p>
        </header>

        {/* Summary cards */}
        <section className="mb-10 print:mb-8 print:break-inside-avoid">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-3">
            {t.print.summary_section_title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCell label={t.report.primary_signature_label} value={primarySignatureLabel} />
            <SummaryCell label={t.report.primary_driver_label} value={primaryDriverLabel} />
            <SummaryCell label={t.report.primary_pattern_label} value={primaryPatternLabel} />
            <SummaryCell label={t.report.validity_label} value={validityLabel} />
          </div>
        </section>

        {/* Full report — main reading content */}
        {row.report_text ? (
          <section className="mb-12 print:mb-10">
            <div className="text-[1.0625rem] leading-[1.85] space-y-5">
              {blocks.map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h3
                      key={i}
                      className="text-xl md:text-2xl font-serif text-ink mt-8 first:mt-0 mb-1 leading-snug print:break-after-avoid print:mt-6"
                    >
                      {block.slice(3).trim()}
                    </h3>
                  );
                }
                return (
                  <p key={i} className="whitespace-pre-line text-ink-soft">
                    {block}
                  </p>
                );
              })}
            </div>
          </section>
        ) : (
          <p className="text-ink-mute italic mb-10">{t.print.no_report_yet}</p>
        )}

        {/* All signatures (no bars — text only, prints cleanly) */}
        <section className="mb-10 print:mb-8 print:break-inside-avoid">
          <h2 className="text-base font-serif text-ink mb-3 print:break-after-avoid">
            {t.print.signatures_section_title}
          </h2>
          <ul className="space-y-1">
            {Object.entries(signatures).map(([name, s]) => (
              <TextScoreRow
                key={name}
                label={localize(name, SIGNATURE_AR, lang, prettify(name))}
                score={s.score}
                band={localizeBand(s.band, lang)}
              />
            ))}
          </ul>
        </section>

        {/* All drivers */}
        <section className="mb-12 print:mb-8 print:break-inside-avoid">
          <h2 className="text-base font-serif text-ink mb-3 print:break-after-avoid">
            {t.print.drivers_section_title}
          </h2>
          <ul className="space-y-2">
            {Object.entries(drivers).map(([name, d]) => (
              <li key={name} className="grid grid-cols-3 gap-3 text-sm">
                <span className="text-ink font-medium">
                  {localize(name, DRIVER_AR, lang, prettify(name))}
                </span>
                <span className="text-ink-soft">
                  {t.print.intensity_label}: {d.intensity.score} ({localizeBand(d.intensity.band, lang)})
                </span>
                <span className="text-ink-soft">
                  {t.print.regulation_label}: {d.regulation.score} ({localizeBand(d.regulation.band, lang)})
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-line text-xs text-ink-mute space-y-1">
          <p>
            {t.print.session_label}:{" "}
            <span className="font-mono">{row.session_id}</span>
          </p>
          <p>
            {t.print.generated_label}: {formatDate(generatedAt)}
          </p>
        </footer>
      </article>
    </PrintShell>
  );
}

// ---------------------------------------------------------------------------
// Shell — toolbar + container. Toolbar hides under @media print.
// ---------------------------------------------------------------------------

function PrintShell({
  sessionId,
  t,
  children,
}: {
  sessionId: string;
  t: ReturnType<typeof useLanguage>["t"];
  children: React.ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{t.print.title}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-white text-ink print:bg-white">
        {/* On-screen-only toolbar */}
        <div className="print:hidden border-b border-line bg-paper-warm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              href={sessionId ? `/report/${encodeURIComponent(sessionId)}` : "/dashboard"}
              className="text-sm text-ink-soft hover:text-ink transition-colors duration-200"
            >
              {t.print.back_to_report}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              className="inline-flex items-center justify-center rounded-md font-medium px-5 py-2.5 text-sm bg-accent text-paper-card border border-accent hover:bg-accent-deep transition-colors duration-200"
            >
              {t.print.print_button}
            </button>
          </div>
        </div>

        {/* Report content */}
        <main className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 print:px-0 print:py-0 print:max-w-none">
          {children}
        </main>
      </div>
    </>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line rounded-md p-3 print:break-inside-avoid">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1.5">
        {label}
      </div>
      <div
        className="text-sm md:text-base font-serif text-ink leading-snug break-words"
        style={{ overflowWrap: "anywhere" }}
      >
        {value}
      </div>
    </div>
  );
}

function TextScoreRow({
  label,
  score,
  band,
}: {
  label: string;
  score: number;
  band: string;
}) {
  return (
    <li className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm py-1">
      <span className="text-ink font-medium">{label}</span>
      <span className="text-ink-mute tabular-nums">{score}</span>
      <span className="text-ink-mute text-xs uppercase tracking-wider min-w-[80px] text-end">
        {band}
      </span>
    </li>
  );
}
