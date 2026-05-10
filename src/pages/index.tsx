import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <Layout>
      {/* Hero */}
      <Section spacing="spacious">
        <h1 className="text-[2.25rem] sm:text-4xl md:text-5xl font-serif tracking-[-0.02em] text-ink mb-8 leading-[1.15]">
          {t.home.hero_heading}
        </h1>
        <p className="text-lg text-ink-soft leading-[1.7] mb-10 max-w-prose">
          {t.home.hero_body}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/start">
            <Button size="lg" className="w-full sm:w-auto">
              {t.home.cta_primary}
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              {t.home.cta_secondary}
            </Button>
          </Link>
        </div>
      </Section>

      {/* What it measures */}
      <Section divided>
        <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-8 leading-tight">
          {t.home.measures_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.home.measures_p1}</p>
          <p>{t.home.measures_p2}</p>
          <p>{t.home.measures_p3}</p>
        </div>
      </Section>

      {/* Why pressure patterns matter */}
      <Section divided>
        <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-8 leading-tight">
          {t.home.why_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.home.why_p1}</p>
          <p>{t.home.why_p2}</p>
        </div>
      </Section>

      {/* What the report reveals */}
      <Section divided>
        <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-4 leading-tight">
          {t.home.reveals_title}
        </h2>
        <p className="text-ink-soft leading-relaxed mb-10">
          {t.home.reveals_intro}
        </p>
        <ul className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => {
            const titleKey = `reveals_item${n}_title` as keyof typeof t.home;
            const bodyKey = `reveals_item${n}_body` as keyof typeof t.home;
            return (
              <li
                key={n}
                className="border border-line bg-paper-card rounded-md p-6 md:p-7"
              >
                <h3 className="text-base md:text-lg font-serif text-ink mb-2 leading-snug">
                  {t.home[titleKey] as string}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {t.home[bodyKey] as string}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* How it works */}
      <Section divided>
        <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-10 leading-tight">
          {t.home.how_title}
        </h2>
        <ol className="grid gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((n) => {
            const titleKey = `how_step${n}_title` as keyof typeof t.home;
            const bodyKey = `how_step${n}_body` as keyof typeof t.home;
            return (
              <li key={n} className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-3">
                  {String(n).padStart(2, "0")}
                </span>
                <h3 className="text-base md:text-lg font-serif text-ink mb-2 leading-snug">
                  {t.home[titleKey] as string}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {t.home[bodyKey] as string}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* Final CTA */}
      <Section divided>
        <h2 className="text-2xl md:text-[1.75rem] font-serif text-ink mb-5 leading-tight">
          {t.home.final_cta_title}
        </h2>
        <p className="text-ink-soft leading-[1.7] mb-8 max-w-prose">
          {t.home.final_cta_body}
        </p>
        <Link href="/start">
          <Button size="lg" className="w-full sm:w-auto">
            {t.home.cta_primary}
          </Button>
        </Link>
      </Section>
    </Layout>
  );
}
