import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/lib/supabase/useUser";

export default function Navigation() {
  const { lang, setLang, t } = useLanguage();
  const { user, loading: userLoading } = useUser();

  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-ink hover:text-accent transition-colors duration-200"
        >
          {t.nav.logo}
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm text-ink-soft">
          <Link
            href="/about"
            className="hover:text-ink transition-colors duration-200"
          >
            {t.nav.about}
          </Link>

          {/* Dashboard link — only when signed in. We render nothing during
              the initial auth load to avoid a flash. */}
          {!userLoading && user && (
            <Link
              href="/dashboard"
              className="hover:text-ink transition-colors duration-200"
            >
              {t.nav.dashboard}
            </Link>
          )}

          <Link
            href="/start"
            className="text-accent hover:text-accent-deep font-medium transition-colors duration-200"
          >
            {t.nav.begin}
          </Link>

          {/* Language toggle */}
          <div className="flex items-center gap-1.5 text-xs font-medium ms-1 ps-3 sm:ps-4 border-s border-line">
            <button
              onClick={() => setLang("en")}
              aria-label="Switch to English"
              aria-pressed={lang === "en"}
              className={`transition-colors duration-200 ${
                lang === "en"
                  ? "text-ink font-semibold"
                  : "text-ink-mute hover:text-ink-soft"
              }`}
            >
              EN
            </button>
            <span className="text-ink-faint select-none" aria-hidden>
              /
            </span>
            <button
              onClick={() => setLang("ar")}
              aria-label="Switch to Arabic"
              aria-pressed={lang === "ar"}
              className={`transition-colors duration-200 ${
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
