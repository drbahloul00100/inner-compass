import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Display-time translations for engine output values.
//
// These live in this file (not in src/lib/translations/*) because they
// translate engine *output values* — domain-specific labels tightly coupled
// to the scoring constants — rather than UI chrome. UI chrome lives in
// t.report.*. When language is EN we render the original snake_case term
// after a small prettifier (controller → "Controller"); when AR we look up
// the curated Arabic translation provided by the product team.
// ---------------------------------------------------------------------------

const SIGNATURE_AR: Record<string, string> = {
  fixer: "المُصلح",
  controller: "المتحكم",
  vanisher: "المتغيب",
  polisher: "المُلمِّع",
  escalator: "المُصعِّد",
  over_explainer: "المُبرِّر",
  shutter: "المُغلِق",
  accommodator: "المُهادِن",
  critic: "الناقد",
  sealed: "المكتوم",
  doubler: "المُضاعِف",
};

const DRIVER_AR: Record<string, string> = {
  hunger_to_matter: "الحاجة للأهمية",
  hunger_to_be_seen: "الحاجة للظهور",
  hunger_for_control: "الحاجة للسيطرة",
  hunger_to_be_right: "الحاجة للصواب",
  hunger_for_safety: "الحاجة للأمان",
  hunger_to_be_loved: "الحاجة للمحبة",
  hunger_for_freedom: "الحاجة للحرية",
  hunger_to_belong: "الحاجة للانتماء",
  hunger_to_be_free_of_failure: "الحاجة لتجنب الفشل",
};

const PATTERN_AR: Record<string, string> = {
  the_performance_loop: "دائرة الأداء",
  the_fortress: "القلعة",
  the_loaded_carrier: "الحامل المثقل",
  the_bargained_self: "الذات المُساوَمة",
  the_strategic_withdrawal: "الانسحاب الاستراتيجي",
  the_mission_bottleneck: "عنق الزجاجة",
  the_audit: "التدقيق",
};

const BAND_AR: Record<string, string> = {
  // signature_activation / driver_intensity
  dominant: "مهيمن",
  strong: "قوي",
  present: "حاضر",
  quiet: "هادئ",
  // driver_regulation
  mastered: "متحكم فيه",
  steady: "مستقر",
  working: "قيد العمل",
  strained: "متوتر",
  // recovery_cost
  very_high: "مرتفع جداً",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
  very_low: "منخفض جداً",
  // pattern_match
  very_strong: "قوي جداً",
  moderate: "معتدل",
  weak: "ضعيف",
};

const VALIDITY_AR: Record<string, string> = {
  high: "عالية",
  good: "جيدة",
  moderate: "متوسطة",
  low: "منخفضة",
};

function prettify(snake: string): string {
  if (!snake) return "";
  const spaced = snake.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function localize(
  value: string | null | undefined,
  map: Record<string, string>,
  lang: Language,
  fallback: string
): string {
  if (value === null || value === undefined || value === "") return fallback;
  // Engine emits lowercase snake_case but tolerate accidental casing /
  // whitespace drift from older rows. Try the exact key first, then a
  // normalized form.
  const raw = String(value);
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lang === "ar") {
    const hit = map[trimmed] ?? map[lower];
    if (hit) return hit;
    // Surface the miss in dev so we notice if the engine ever emits a key
    // we don't have a translation for. Silent in production.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[report] no AR translation for value:", JSON.stringify(raw));
    }
    return prettify(trimmed);
  }
  return prettify(trimmed);
}

// ---------------------------------------------------------------------------
// Minimal scoring-result shape we actually consume on this page. (The full
// ScoringResult interface lives in src/lib/scoring/types.ts but we don't
// import it here — importing engine types could risk pulling engine code
// into the client bundle via barrel files. The shapes below are a hand
// re-declaration of the consumer-only subset.)
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

export default function ReportPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [row, setRow] = useState<ScoringRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Report-generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async () => {
    if (!row || generating) return;
    setGenerating(true);
    setGenerateError(null);

    // Generous client cap. Server budget is 26s; 45s gives ample slack for
    // cold-start, network, and Netlify's edge proxy hops without ever
    // cutting off mid-response. If the server itself 504s we'll hear about
    // it through the !res.ok branch with status 504, not a client abort.
    const controller = new AbortController();
    const FETCH_TIMEOUT_MS = 45000;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          session_id: row.session_id,
          scoring_json: row.scoring_json,
          language: lang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // eslint-disable-next-line no-console
        console.warn("[report] generate-report not ok:", res.status, text);
        setGenerateError(`${res.status} ${text.slice(0, 200)}`);
        setGenerating(false);
        return;
      }

      const body = (await res.json()) as {
        report_text?: string;
        word_count?: number;
        generated_at?: string;
      };

      const reportText = typeof body.report_text === "string" ? body.report_text : "";
      if (!reportText) {
        setGenerateError("empty_response");
        setGenerating(false);
        return;
      }

      const generatedAt = body.generated_at ?? new Date().toISOString();

      // Persist back to Supabase. RLS already allows updates on this table
      // (Phase 3 permissive policy). Best-effort: if the write fails, we
      // still render the report from in-memory state so the user gets value.
      try {
        const supabase = createClient();
        await supabase
          .from("scoring_results")
          .update({
            report_text: reportText,
            report_generated_at: generatedAt,
          })
          .eq("session_id", row.session_id);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[report] failed to persist report_text (non-fatal):", e);
      }

      setRow({
        ...row,
        report_text: reportText,
        report_generated_at: generatedAt,
      });
      setGenerating(false);
    } catch (e) {
      clearTimeout(timeoutId);
      const isAbort = e instanceof Error && e.name === "AbortError";
      const detail = isAbort
        ? `client_timeout_after_${FETCH_TIMEOUT_MS}ms`
        : e instanceof Error
        ? e.message
        : String(e);
      // eslint-disable-next-line no-console
      console.warn("[report] generate fetch error:", detail);
      setGenerateError(detail);
      setGenerating(false);
    }
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

        {/* Larger primary stats — 2x2 on mobile, 1x4 on desktop */}
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
              regenerateLabel={t.report.regenerate_button}
              generatingLabel={t.report.generating}
              copied={copied}
              onCopy={handleCopy}
              onRegenerate={handleGenerate}
              regenerating={generating}
            />
          ) : (
            <GeneratePrompt
              title={t.report.generate_section_title}
              intro={t.report.generate_intro}
              buttonLabel={t.report.generate_button}
              generatingLabel={t.report.generating}
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

function localizeBand(band: string | undefined, lang: Language): string {
  if (!band) return "";
  if (lang === "ar") return BAND_AR[band] ?? prettify(band);
  return prettify(band);
}

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
      {/* break-words + overflow-wrap prevent long single tokens from
          overflowing the card; flex-1 lets the value occupy remaining
          vertical space so card heights line up across the row. */}
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

function GeneratePrompt({
  title,
  intro,
  buttonLabel,
  generatingLabel,
  errorLabel,
  generating,
  error,
  onGenerate,
}: {
  title: string;
  intro: string;
  buttonLabel: string;
  generatingLabel: string;
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
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="h-5 w-5 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
          />
          <p className="text-sm text-ink-mute">{generatingLabel}</p>
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
  regenerateLabel,
  generatingLabel,
  copied,
  onCopy,
  onRegenerate,
  regenerating,
}: {
  text: string;
  wordCount: number;
  wordsLabel: (n: number) => string;
  sectionTitle: string;
  copyLabel: string;
  copiedLabel: string;
  regenerateLabel: string;
  generatingLabel: string;
  copied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  // Split on blank lines; trim and drop empty paragraphs.
  const paragraphs = text
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCopy} disabled={regenerating}>
            {copied ? copiedLabel : copyLabel}
          </Button>
          <Button variant="ghost" onClick={onRegenerate} disabled={regenerating}>
            {regenerateLabel}
          </Button>
        </div>
      </div>

      {regenerating && (
        <div className="flex items-center gap-3 mb-6 text-sm text-ink-mute">
          <div
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
          />
          <p>{generatingLabel}</p>
        </div>
      )}

      <article className="bg-paper-card border border-line rounded-md p-6 md:p-10">
        <div className="space-y-5 text-ink-soft leading-[1.85] text-[1.0625rem]">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
