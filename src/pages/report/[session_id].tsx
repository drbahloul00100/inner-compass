import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

// Minimal scoring-result shape we actually consume on this page. The full
// ScoringResult interface lives in src/lib/scoring/types.ts but importing
// it directly would (via barrels) potentially pull engine logic into the
// client bundle. We re-declare a tiny subset here for safety.
interface SignatureView { score: number; band: string }
interface DriverView {
  intensity: { score: number; band: string };
  regulation: { score: number; band: string };
}
interface PatternView { match: number; band: string }

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
}

// Phase 3 placeholder. Shows the raw scoring output in a structured but
// minimal way. Phase 4 replaces this with the full written report.
export default function ReportPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
          "session_id, engine_version, scoring_json, primary_signature, primary_driver, primary_pattern, validity_confidence, scored_at"
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

  return (
    <Layout title="Report">
      <Section spacing="spacious">
        <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-3 leading-[1.15]">
          {t.report.title}
        </h1>
        <p className="text-ink-soft leading-[1.7] mb-10 max-w-prose">
          {t.report.subtitle}
        </p>

        {/* Primary fields */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <SummaryStat label={t.report.primary_signature_label} value={row.primary_signature ?? t.report.none} />
          <SummaryStat label={t.report.primary_driver_label} value={row.primary_driver ?? t.report.none} />
          <SummaryStat label={t.report.primary_pattern_label} value={row.primary_pattern ?? t.report.none} />
          <SummaryStat label={t.report.validity_label} value={row.validity_confidence ?? t.report.none} />
        </div>

        {/* Signatures */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-serif text-ink mb-5 leading-tight">
            {t.report.signatures_section_title}
          </h2>
          <ul className="space-y-2">
            {Object.entries(signatures).map(([name, s]) => (
              <ScoreRow key={name} label={name} score={s.score} band={s.band} />
            ))}
          </ul>
        </section>

        {/* Drivers */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-serif text-ink mb-5 leading-tight">
            {t.report.drivers_section_title}
          </h2>
          <ul className="space-y-3">
            {Object.entries(drivers).map(([name, d]) => (
              <li
                key={name}
                className="border border-line bg-paper-card rounded-md p-4"
              >
                <div className="text-sm font-medium text-ink mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-ink-mute mb-1">
                      {t.report.intensity_label}
                    </div>
                    <ScoreBar score={d.intensity.score} band={d.intensity.band} />
                  </div>
                  <div>
                    <div className="text-ink-mute mb-1">
                      {t.report.regulation_label}
                    </div>
                    <ScoreBar score={d.regulation.score} band={d.regulation.band} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Patterns */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-serif text-ink mb-5 leading-tight">
            {t.report.patterns_section_title}
          </h2>
          <ul className="space-y-2">
            {Object.entries(patterns).map(([name, p]) => (
              <ScoreRow
                key={name}
                label={name}
                score={Math.round(p.match * 100)}
                band={p.band}
                suffix={t.report.match_label}
              />
            ))}
          </ul>
        </section>

        <p className="text-xs italic text-ink-mute mb-8">
          {t.report.placeholder_note}
        </p>

        <Link href="/dashboard">
          <Button variant="ghost">{t.report.back_to_dashboard}</Button>
        </Link>
      </Section>
    </Layout>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-paper-card rounded-md p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-mute mb-1">
        {label}
      </div>
      <div className="text-sm font-medium text-ink truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  score,
  band,
  suffix,
}: {
  label: string;
  score: number;
  band: string;
  suffix?: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="flex-1 text-ink-soft truncate">{label}</span>
      <ScoreBar score={score} band={band} />
      <span className="w-16 text-end text-xs text-ink-mute tabular-nums">
        {suffix ? `${score} ${suffix}` : score}
      </span>
    </li>
  );
}

function ScoreBar({ score, band }: { score: number; band: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
        <div
          className="h-full bg-accent/60 rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-ink-mute w-20 truncate" title={band}>
        {band}
      </span>
    </div>
  );
}
