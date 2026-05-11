import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";

// Phase 2 placeholder. After a brief delay, redirects to the dashboard.
// In Phase 3 this is where the scoring engine will be triggered.
export default function Preparing() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!router.isReady) return;
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router, router.isReady]);

  return (
    <Layout hideNav hideFooter title="Preparing">
      <Section spacing="spacious">
        <div className="flex flex-col items-center text-center">
          <div
            aria-hidden
            className="h-10 w-10 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
          />
          <h1 className="text-2xl md:text-[1.75rem] font-serif text-ink mt-6 mb-2 leading-tight">
            {t.preparing.title}
          </h1>
          <p className="text-ink-mute">{t.preparing.subtitle}</p>
        </div>
      </Section>
    </Layout>
  );
}
