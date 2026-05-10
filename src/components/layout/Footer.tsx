import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-paper-warm mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 text-sm">
        <div>
          <p className="text-ink font-medium mb-1">{t.nav.logo}</p>
          <p className="text-ink-mute text-xs leading-relaxed max-w-sm">
            {t.footer.tagline}
          </p>
        </div>
        <div className="flex flex-col md:items-end gap-2 text-ink-mute">
          <nav className="flex items-center gap-5">
            <Link
              href="/about"
              className="hover:text-ink transition-colors duration-200"
            >
              {t.footer.about}
            </Link>
            <span className="text-ink-faint">{t.footer.privacy}</span>
            <span className="text-ink-faint">{t.footer.terms}</span>
          </nav>
          <p className="text-xs text-ink-faint">{t.footer.copyright(year)}</p>
        </div>
      </div>
    </footer>
  );
}
