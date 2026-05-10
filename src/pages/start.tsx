import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Section from "@/components/ui/Section";
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
      <Section spacing="spacious">
        <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-8 leading-[1.15]">
          {t.start.title}
        </h1>

        <div className="flex flex-wrap gap-2 mb-10">
          <Pill>{t.start.pill_minutes}</Pill>
          <Pill>{t.start.pill_questions}</Pill>
          <Pill>{t.start.pill_saved}</Pill>
        </div>

        <div className="space-y-6 text-ink-soft leading-[1.75] text-[1.0625rem]">
          <p>{t.start.p1}</p>
          <p>{t.start.p2}</p>
          <p>{t.start.p3}</p>
        </div>

        <p className="mt-8 pt-8 border-t border-line text-sm italic text-ink-mute leading-relaxed">
          {t.start.disclaimer}
        </p>

        <div className="mt-10">
          <Button size="lg" onClick={handleBegin} className="w-full sm:w-auto">
            {t.start.cta}
          </Button>
        </div>
      </Section>
    </Layout>
  );
}
