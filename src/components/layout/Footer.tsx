import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper-warm mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-mute">
        <p>© {new Date().getFullYear()} Inner Compass</p>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <span className="text-ink-faint">Privacy</span>
          <span className="text-ink-faint">Terms</span>
        </nav>
      </div>
    </footer>
  );
}
