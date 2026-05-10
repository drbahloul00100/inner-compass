import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import { generateSessionId } from "@/lib/session";
import { createSession } from "@/lib/storage";

export default function Start() {
  const router = useRouter();

  const handleBegin = () => {
    const id = generateSessionId();
    createSession(id);
    router.push(`/assessment/${id}`);
  };

  return (
    <Layout title="Begin">
      <section className="max-w-reading mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-serif text-ink mb-8 leading-tight">
          Before you begin
        </h1>

        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>
            The assessment takes about 15 minutes. Some questions ask about
            specific situations and how you would actually respond. Others
            ask you to reflect on patterns you have noticed in yourself.
          </p>
          <p>
            The accuracy of your report depends on the honesty of your
            answers. Where possible, take the assessment in a moment when
            you are not rushed — and ideally not on a day when you are
            performing at your highest. The point of Inner Compass is to see
            the version of you that appears when your capacity is stretched,
            and that version is most accessible when you are tired or in a
            real moment of life rather than at peak.
          </p>
          <p>
            You can navigate back to change earlier answers. Your progress is
            saved automatically on this device.
          </p>
          <p className="text-sm italic text-ink-mute pt-2">
            Inner Compass is a self-awareness tool. It is not a clinical
            assessment, and it does not diagnose any condition. By
            continuing, you confirm you are taking it for personal
            reflection.
          </p>
        </div>

        <div className="mt-12">
          <Button size="lg" onClick={handleBegin}>
            Begin
          </Button>
        </div>
      </section>
    </Layout>
  );
}
