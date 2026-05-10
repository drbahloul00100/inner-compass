import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <Layout>
      <section className="max-w-reading mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-ink mb-8 leading-tight">
          {t.home.hero_heading}
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed mb-10">
          {t.home.hero_body}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/start">
            <Button size="lg">{t.home.cta_primary}</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="secondary">
              {t.home.cta_secondary}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-reading mx-auto px-6 py-16 border-t border-line">
        <h2 className="text-2xl font-serif text-ink mb-8">
          {t.home.measures_title}
        </h2>
        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>{t.home.measures_p1}</p>
          <p>{t.home.measures_p2}</p>
          <p>{t.home.measures_p3}</p>
        </div>
      </section>

      <section className="max-w-reading mx-auto px-6 py-16 border-t border-line">
        <h2 className="text-2xl font-serif text-ink mb-8">
          {t.home.expect_title}
        </h2>
        <ul className="space-y-5 text-ink-soft leading-relaxed">
          <li>
            <span className="font-medium text-ink">{t.home.expect_time_label}</span>{" "}
            {t.home.expect_time_body}
          </li>
          <li>
            <span className="font-medium text-ink">{t.home.expect_style_label}</span>{" "}
            {t.home.expect_style_body}
          </li>
          <li>
            <span className="font-medium text-ink">{t.home.expect_output_label}</span>{" "}
            {t.home.expect_output_body}
          </li>
          <li>
            <span className="font-medium text-ink">{t.home.expect_privacy_label}</span>{" "}
            {t.home.expect_privacy_body}
          </li>
        </ul>
      </section>
    </Layout>
  );
}
