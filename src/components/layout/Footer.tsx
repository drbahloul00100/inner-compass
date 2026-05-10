import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-paper-warm mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-mute">
        <p>{t.footer.copyright(year)}</p>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="hover:text-ink transition-colors">
            {t.footer.about}
          </Link>
          <span className="text-ink-faint">{t.footer.privacy}</span>
          <span className="text-ink-faint">{t.footer.terms}</span>
        </nav>
      </div>
    </footer>
  );
}
