import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <Layout title="About">
      <section className="max-w-reading mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-serif text-ink mb-10 leading-tight">
          {t.about.title}
        </h1>

        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>{t.about.p1}</p>
          <p>{t.about.p2}</p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">
            {t.about.how_title}
          </h2>
          <p>{t.about.how_p1}</p>
          <p>{t.about.how_p2}</p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">
            {t.about.not_title}
          </h2>
          <p>{t.about.not_p1}</p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">
            {t.about.privacy_title}
          </h2>
          <p>{t.about.privacy_p1}</p>
        </div>

        <div className="mt-12">
          <Link href="/start">
            <Button size="lg">{t.about.cta}</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
