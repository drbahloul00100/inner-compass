import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Navigation() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-ink hover:text-accent transition-colors"
        >
          {t.nav.logo}
        </Link>

        <nav className="flex items-center gap-6 text-sm text-ink-soft">
          <Link href="/about" className="hover:text-ink transition-colors">
            {t.nav.about}
          </Link>
          <Link
            href="/start"
            className="text-accent hover:text-accent-deep transition-colors"
          >
            {t.nav.begin}
          </Link>

          {/* Language toggle */}
          <div className="flex items-center gap-1 text-xs font-medium ms-1 ps-4 border-s border-line">
            <button
              onClick={() => setLang("en")}
              aria-label="Switch to English"
              aria-pressed={lang === "en"}
              className={`transition-colors ${
                lang === "en"
                  ? "text-ink font-semibold"
                  : "text-ink-mute hover:text-ink-soft"
              }`}
            >
              EN
            </button>
            <span className="text-ink-faint select-none">/</span>
            <button
              onClick={() => setLang("ar")}
              aria-label="Switch to Arabic"
              aria-pressed={lang === "ar"}
              className={`transition-colors ${
                lang === "ar"
                  ? "text-ink font-semibold"
                  : "text-ink-mute hover:text-ink-soft"
              }`}
            >
              AR
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
