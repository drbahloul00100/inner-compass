import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <Layout>
      <section className="max-w-reading mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-ink mb-8 leading-tight">
          A mirror calibrated to show you who you become under pressure —
          not who you describe yourself as on a calm day.
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed mb-10">
          Inner Compass is a self-awareness assessment for thoughtful adults.
          It measures behavior under pressure rather than self-image, and
          produces a personal report calibrated to the version of you that
          shows up when your capacity is exceeded.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/start">
            <Button size="lg">Begin the assessment</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="secondary">
              Read more first
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-reading mx-auto px-6 py-16 border-t border-line">
        <h2 className="text-2xl font-serif text-ink mb-8">What it measures</h2>
        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>
            Most personality assessments tell you who you are on your best
            day. Inner Compass tells you who you become on your worst.
          </p>
          <p>
            Across 84 carefully written items, it measures your pressure
            signatures (what tends to appear when you are stretched), your
            inner drivers (the deeper hungers shaping your choices), and the
            way these combine into a recognizable pattern.
          </p>
          <p>
            The result is a written report — direct, warm, and specific —
            designed to be read once carefully and revisited later.
          </p>
        </div>
      </section>

      <section className="max-w-reading mx-auto px-6 py-16 border-t border-line">
        <h2 className="text-2xl font-serif text-ink mb-8">What to expect</h2>
        <ul className="space-y-5 text-ink-soft leading-relaxed">
          <li>
            <span className="font-medium text-ink">Time required:</span> about
            15 minutes of honest answering.
          </li>
          <li>
            <span className="font-medium text-ink">Question style:</span>{" "}
            behavioral scenarios, not personality preferences.
          </li>
          <li>
            <span className="font-medium text-ink">Output:</span> a personal
            report you can read in the browser or download.
          </li>
          <li>
            <span className="font-medium text-ink">Privacy:</span> your
            responses are private to you. They are never sold or shared.
          </li>
        </ul>
      </section>
    </Layout>
  );
}
