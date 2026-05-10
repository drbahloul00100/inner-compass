import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";

export default function About() {
  return (
    <Layout title="About">
      <section className="max-w-reading mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-serif text-ink mb-10 leading-tight">
          About Inner Compass
        </h1>

        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>
            Inner Compass exists for one reason. Most people have a clear
            sense of who they are on a calm day, in a familiar context, with
            their capacity intact. Far fewer have an honest map of who they
            become when their capacity is exceeded — under pressure, fatigue,
            real stakes, or interpersonal difficulty.
          </p>
          <p>
            That second version of you is the one that costs you most.
            Decisions made there shape careers and relationships. Behaviors
            patterned there compound silently. The version of you under
            pressure is a real version, and it is the one Inner Compass is
            designed to surface.
          </p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">
            How it works
          </h2>
          <p>
            The assessment is 84 questions. Most are behavioral — they ask
            what you would actually do in a specific situation, not how you
            see yourself. A few are calibration questions designed to help
            the system recognize when answers may be coming from self-image
            rather than self-observation.
          </p>
          <p>
            Once you complete the assessment, your responses are scored
            against a model of pressure signatures and inner drivers, then
            translated into a written report.
          </p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">
            What it is not
          </h2>
          <p>
            Inner Compass is not a clinical instrument. It does not diagnose,
            classify, or pathologize. It is a tool for self-awareness — for
            thoughtful adults who want a more honest map of themselves than
            most assessments provide.
          </p>

          <h2 className="text-xl font-serif text-ink pt-6 mt-6">Privacy</h2>
          <p>
            Your responses are private. They are not sold, not shared, and
            not used to train any external system. The assessment includes
            one open-text item that is used only to calibrate the
            interpretation of your other answers; that text never appears in
            your report.
          </p>
        </div>

        <div className="mt-12">
          <Link href="/start">
            <Button size="lg">Begin the assessment</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
