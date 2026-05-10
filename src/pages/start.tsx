import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { generateSessionId } from "@/lib/session";
import { createSession } from "@/lib/storage";

export default function Start() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleBegin = () => {
    const id = generateSessionId();
    createSession(id);
    router.push(`/assessment/${id}`);
  };

  return (
    <Layout title="Begin">
      <section className="max-w-reading mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-serif text-ink mb-8 leading-tight">
          {t.start.title}
        </h1>

        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>{t.start.p1}</p>
          <p>{t.start.p2}</p>
          <p>{t.start.p3}</p>
          <p className="text-sm italic text-ink-mute pt-2">{t.start.disclaimer}</p>
        </div>

        <div className="mt-12">
          <Button size="lg" onClick={handleBegin}>
            {t.start.cta}
          </Button>
        </div>
      </section>
    </Layout>
  );
}
