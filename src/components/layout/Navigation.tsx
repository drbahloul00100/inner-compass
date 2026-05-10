import Link from "next/link";

export default function Navigation() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-ink hover:text-accent transition-colors"
        >
          Inner Compass
        </Link>
        <nav className="flex items-center gap-8 text-sm text-ink-soft">
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link
            href="/start"
            className="text-accent hover:text-accent-deep transition-colors"
          >
            Begin
          </Link>
        </nav>
      </div>
    </header>
  );
}
