import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <Layout title="About">
      <Section spacing="spacious">
        <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-10 leading-[1.15]">
          {t.about.title}
        </h1>

        <div className="space-y-7 text-ink-soft leading-[1.75] text-[1.0625rem]">
          <p>{t.about.p1}</p>
          <p>{t.about.p2}</p>
        </div>
      </Section>

      <Section divided spacing="tight">
        <h2 className="text-xl md:text-2xl font-serif text-ink mb-6 leading-tight">
          {t.about.how_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.about.how_p1}</p>
          <p>{t.about.how_p2}</p>
        </div>
      </Section>

      <Section divided spacing="tight">
        <h2 className="text-xl md:text-2xl font-serif text-ink mb-6 leading-tight">
          {t.about.who_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.about.who_p1}</p>
        </div>
      </Section>

      <Section divided spacing="tight">
        <h2 className="text-xl md:text-2xl font-serif text-ink mb-6 leading-tight">
          {t.about.not_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.about.not_p1}</p>
        </div>
      </Section>

      <Section divided spacing="tight">
        <h2 className="text-xl md:text-2xl font-serif text-ink mb-6 leading-tight">
          {t.about.privacy_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-[1.75]">
          <p>{t.about.privacy_p1}</p>
        </div>

        <div className="mt-12">
          <Link href="/start">
            <Button size="lg" className="w-full sm:w-auto">
              {t.about.cta}
            </Button>
          </Link>
        </div>
      </Section>
    </Layout>
  );
}
