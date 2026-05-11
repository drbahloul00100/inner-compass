import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import FadeUp from "@/components/motion/FadeUp";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import HeroBackground from "@/components/marketing/HeroBackground";
import ReportPreview from "@/components/marketing/ReportPreview";
import {
  PressureSignatureIcon,
  InnerDriverIcon,
  DecisionArchitectureIcon,
  EmotionalSystemIcon,
  RelationshipPatternIcon,
  LeadershipFootprintIcon,
} from "@/components/icons/RevealIcons";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/i18n";

const REVEAL_ICONS = [
  PressureSignatureIcon,
  InnerDriverIcon,
  DecisionArchitectureIcon,
  EmotionalSystemIcon,
  RelationshipPatternIcon,
  LeadershipFootprintIcon,
];

export default function Home() {
  const { t } = useLanguage();
  const home = t.home;

  const stats = [
    { value: 84, label: home.stats_items_label },
    { value: 11, label: home.stats_signatures_label },
    { value: 9, label: home.stats_drivers_label },
    { value: 4, label: home.stats_domains_label },
    { value: 2, label: home.stats_modes_label },
  ];

  const reveals: Array<{ title: string; body: string }> = [
    { title: home.reveal1_title, body: home.reveal1_body },
    { title: home.reveal2_title, body: home.reveal2_body },
    { title: home.reveal3_title, body: home.reveal3_body },
    { title: home.reveal4_title, body: home.reveal4_body },
    { title: home.reveal5_title, body: home.reveal5_body },
    { title: home.reveal6_title, body: home.reveal6_body },
  ];

  const flow: Array<{ title: string; body: string }> = [
    { title: home.flow1_title, body: home.flow1_body },
    { title: home.flow2_title, body: home.flow2_body },
    { title: home.flow3_title, body: home.flow3_body },
    { title: home.flow4_title, body: home.flow4_body },
  ];

  return (
    <Layout>
      {/* Hero with subtle animated compass background */}
      <div className="relative">
        <HeroBackground />
        <Section spacing="spacious" className="relative">
          <FadeUp>
            <h1 className="text-[2.25rem] sm:text-4xl md:text-5xl font-serif tracking-[-0.02em] text-ink mb-8 leading-[1.15]">
              {home.hero_heading}
            </h1>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p className="text-lg text-ink-soft leading-[1.7] mb-10 max-w-prose">
              {home.hero_body}
            </p>
          </FadeUp>
          <FadeUp delay={0.16}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/start">
                <Button size="lg" className="w-full sm:w-auto">
                  {home.cta_primary}
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {home.cta_secondary}
                </Button>
              </Link>
            </div>
          </FadeUp>
        </Section>
      </div>

      {/* Stats strip — wider than reading width for breathing room */}
      <div className="border-y border-line bg-paper-warm/60">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <ul className="grid grid-cols-2 sm:grid-cols-5 gap-y-10 gap-x-4">
            {stats.map((s, i) => (
              <li key={i} className="text-center">
                <FadeUp delay={i * 0.05}>
                  <div className="text-3xl md:text-[2.25rem] font-serif text-ink mb-2 leading-none">
                    <AnimatedCounter value={s.value} />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-ink-mute">
                    {s.label}
                  </div>
                </FadeUp>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Why pressure patterns matter */}
      <Section>
        <FadeUp>
          <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-8 leading-tight">
            {home.why_title}
          </h2>
        </FadeUp>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <FadeUp delay={0.04}>
            <p>{home.why_p1}</p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p>{home.why_p2}</p>
          </FadeUp>
        </div>
      </Section>

      {/* What Inner Compass reveals — 6 cards */}
      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <FadeUp>
            <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-10 leading-tight max-w-reading">
              {home.reveals_title}
            </h2>
          </FadeUp>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reveals.map((r, i) => {
              const Icon = REVEAL_ICONS[i];
              return (
                <li key={i}>
                  <FadeUp delay={i * 0.05}>
                    <div className="h-full border border-line bg-paper-card rounded-md p-6 md:p-7 transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
                      <Icon className="text-accent mb-5" />
                      <h3 className="text-base md:text-lg font-serif text-ink mb-2 leading-snug">
                        {r.title}
                      </h3>
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  </FadeUp>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* How it works — 4-step flow */}
      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <FadeUp>
            <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-10 leading-tight max-w-reading">
              {home.how_title}
            </h2>
          </FadeUp>
          <ol className="grid gap-5 md:grid-cols-4 md:gap-4">
            {flow.map((step, i) => (
              <li key={i}>
                <FadeUp delay={i * 0.08}>
                  <div className="h-full border border-line bg-paper-card rounded-md p-5 md:p-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3 block tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-serif text-ink mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </FadeUp>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Report Preview */}
      <div className="border-t border-line">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
          <FadeUp>
            <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-4 leading-tight">
              {home.preview_title}
            </h2>
          </FadeUp>
          <FadeUp delay={0.05}>
            <p className="text-ink-soft leading-relaxed mb-10 max-w-prose">
              {home.preview_subtitle}
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <ReportPreview />
          </FadeUp>
        </div>
      </div>

      {/* Early reader reactions — placeholder slots */}
      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <FadeUp>
            <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-4 leading-tight max-w-reading">
              {home.early_title}
            </h2>
          </FadeUp>
          <FadeUp delay={0.04}>
            <p className="text-ink-soft leading-relaxed mb-10 max-w-prose">
              {home.early_subtitle}
            </p>
          </FadeUp>
          <ul className="grid gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <FadeUp delay={i * 0.05}>
                  <div className="h-full border border-dashed border-line-strong bg-paper-veil rounded-md p-6">
                    <PlaceholderBadge t={t} />
                    <p className="text-sm text-ink-mute italic leading-relaxed mt-4">
                      {home.early_placeholder_quote}
                    </p>
                  </div>
                </FadeUp>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Final CTA */}
      <Section divided>
        <FadeUp>
          <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-5 leading-tight">
            {home.final_cta_title}
          </h2>
        </FadeUp>
        <FadeUp delay={0.05}>
          <p className="text-ink-soft leading-[1.7] mb-8 max-w-prose">
            {home.final_cta_body}
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <Link href="/start">
            <Button size="lg" className="w-full sm:w-auto">
              {home.cta_primary}
            </Button>
          </Link>
        </FadeUp>
      </Section>
    </Layout>
  );
}

function PlaceholderBadge({ t }: { t: Translations }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute bg-paper-card border border-line rounded-full">
      {t.home.early_placeholder_label}
    </span>
  );
}
