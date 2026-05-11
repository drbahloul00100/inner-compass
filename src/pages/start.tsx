import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Section from "@/components/ui/Section";
import FadeUp from "@/components/motion/FadeUp";
import { useLanguage } from "@/context/LanguageContext";
import { generateSessionId } from "@/lib/session";
import { createSession } from "@/lib/storage";

// Small compass-rose marker shown above the page title. Symmetric, RTL-safe,
// purely decorative.
function CompassMark() {
  return (
    <svg
      aria-hidden
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      className="text-accent mb-6 opacity-90"
    >
      <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="1" />
      <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <polygon
        points="18,5 19.5,18 18,31 16.5,18"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <line x1="3" y1="18" x2="33" y2="18" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
      <circle cx="18" cy="18" r="1.25" fill="currentColor" />
    </svg>
  );
}

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
        <FadeUp>
          <CompassMark />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-4">
            {t.start.eyebrow}
          </p>
          <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-8 leading-[1.15]">
            {t.start.title}
          </h1>
        </FadeUp>

        <FadeUp delay={0.05}>
          <div className="flex flex-wrap gap-2 mb-10">
            <Pill>{t.start.pill_minutes}</Pill>
            <Pill>{t.start.pill_questions}</Pill>
            <Pill>{t.start.pill_saved}</Pill>
          </div>
        </FadeUp>

        <div className="space-y-6 text-ink-soft leading-[1.75] text-[1.0625rem]">
          <FadeUp delay={0.08}>
            <p>{t.start.p1}</p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <p>{t.start.p2}</p>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p>{t.start.p3}</p>
          </FadeUp>
        </div>

        <FadeUp delay={0.2}>
          <p className="mt-8 pt-8 border-t border-line text-sm italic text-ink-mute leading-relaxed">
            {t.start.disclaimer}
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div className="mt-10">
            <Button size="lg" onClick={handleBegin} className="w-full sm:w-auto">
              {t.start.cta}
            </Button>
          </div>
        </FadeUp>
      </Section>
    </Layout>
  );
}
