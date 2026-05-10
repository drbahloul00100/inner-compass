import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/assessment/ProgressBar";
import QuestionRenderer from "@/components/assessment/QuestionRenderer";
import { QUESTIONS, TOTAL_ITEMS } from "@/lib/questions";
import {
  getOrCreateSession,
  setResponse,
  setCurrentItem,
  getResponse,
  findUnansweredItems,
} from "@/lib/storage";
import { isValidSessionId } from "@/lib/session";
import type { ResponseAnswer, TwoPartAnswer } from "@/types/response";

export default function AssessmentPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<
    ResponseAnswer | undefined
  >(undefined);
  const [hydrated, setHydrated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const questionAreaRef = useRef<HTMLDivElement>(null);

  const allItemIds = useMemo(() => QUESTIONS.map((q) => q.id), []);

  const twoPartItemIds = useMemo(
    () =>
      QUESTIONS.filter(
        (q) => q.answer_type === "two_part_multiple_choice"
      ).map((q) => q.id),
    []
  );

  const twoPartSubIds = useMemo(() => {
    const map: Record<number, string[]> = {};
    QUESTIONS.forEach((q) => {
      if (q.answer_type === "two_part_multiple_choice") {
        map[q.id] = q.options.sub_prompts.map((s) => s.sub_id);
      }
    });
    return map;
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof session_id !== "string") return;

    if (!isValidSessionId(session_id)) {
      router.replace("/start");
      return;
    }

    const session = getOrCreateSession(session_id);
    const startIndex = QUESTIONS.findIndex(
      (q) => q.id === session.current_item_id
    );
    const safeIndex = startIndex >= 0 ? startIndex : 0;
    setCurrentIndex(safeIndex);

    const existing = session.responses[QUESTIONS[safeIndex].id];
    setCurrentAnswer(existing?.answer);
    setHydrated(true);
  }, [router.isReady, session_id, router]);

  if (!hydrated || typeof session_id !== "string") {
    return (
      <Layout hideNav>
        <div className="max-w-reading mx-auto px-6 py-20 text-ink-mute">
          Loading…
        </div>
      </Layout>
    );
  }

  const question = QUESTIONS[currentIndex];
  if (!question) {
    return (
      <Layout>
        <div className="max-w-reading mx-auto px-6 py-20">
          Something went wrong. Please refresh the page.
        </div>
      </Layout>
    );
  }

  // Determine whether the current question has been adequately answered.
  // Item #32 (free_text) is always considered answered — blank is allowed.
  const isAnswered = (): boolean => {
    if (question.answer_type === "free_text") {
      // Free-text items never block advance; blank is allowed.
      return true;
    }

    if (currentAnswer === undefined) return false;

    if (question.answer_type === "two_part_multiple_choice") {
      const tpa = currentAnswer as TwoPartAnswer;
      const subs = question.options.sub_prompts;
      return subs.every(
        (s) => typeof tpa[s.sub_id] === "string" && tpa[s.sub_id].length > 0
      );
    }

    return typeof currentAnswer === "string" && currentAnswer.length > 0;
  };

  // Identify which sub-prompts of a two-part item are missing.
  // Used to give the user a precise error message rather than a generic one.
  const incompleteTwoPartSubs = (): number[] => {
    if (question.answer_type !== "two_part_multiple_choice") return [];
    const subs = question.options.sub_prompts;
    const tpa = (currentAnswer ?? {}) as TwoPartAnswer;
    return subs
      .map((s, idx) =>
        typeof tpa[s.sub_id] === "string" && tpa[s.sub_id].length > 0
          ? -1
          : idx + 1
      )
      .filter((n) => n > 0);
  };

  const persistAnswer = (answer: ResponseAnswer) => {
    setResponse(session_id, question.id, answer);
    setCurrentAnswer(answer);
    if (validationError) setValidationError(null);
  };

  const handleAnswerChange = (answer: ResponseAnswer) => {
    persistAnswer(answer);
  };

  const navigateTo = (newIndex: number) => {
    const newQuestion = QUESTIONS[newIndex];
    if (!newQuestion) return;

    setCurrentItem(session_id, newQuestion.id);
    setCurrentIndex(newIndex);

    const existing = getResponse(session_id, newQuestion.id);
    setCurrentAnswer(existing?.answer);
    setValidationError(null);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) navigateTo(currentIndex - 1);
  };

  const handleNext = () => {
    // For free-text items: if the user advances without typing anything,
    // persist an empty string so the response exists in storage.
    // This ensures completion validation treats item 32 as complete.
    if (question.answer_type === "free_text") {
      if (currentAnswer === undefined) {
        persistAnswer("");
      }
    }

    // For all other items, validate. The button stays enabled; we surface
    // a validation message rather than disabling the action.
    if (!isAnswered()) {
      if (question.answer_type === "two_part_multiple_choice") {
        const missing = incompleteTwoPartSubs();
        const missingText =
          missing.length === 1
            ? `Part ${missing[0]} is unanswered.`
            : `Parts ${missing.join(" and ")} are unanswered.`;
        setValidationError(
          `${missingText} Please answer both parts to continue.`
        );
      } else {
        setValidationError("Please choose a response before continuing.");
      }
      // Move keyboard/screen-reader focus back to the question area.
      questionAreaRef.current?.focus();
      return;
    }

    if (currentIndex < TOTAL_ITEMS - 1) {
      navigateTo(currentIndex + 1);
      return;
    }

    // Last question — validate full completion across all items.
    const incomplete = findUnansweredItems(
      session_id,
      allItemIds,
      twoPartItemIds,
      twoPartSubIds
    );

    if (incomplete.length === 0) {
      router.push(`/finalize?session_id=${session_id}`);
      return;
    }

    const firstIncompleteIdx = QUESTIONS.findIndex(
      (q) => q.id === incomplete[0]
    );
    setValidationError(
      `${incomplete.length} ${
        incomplete.length === 1 ? "question is" : "questions are"
      } still unanswered. Returning you to the first one.`
    );
    setTimeout(() => navigateTo(firstIncompleteIdx), 1200);
  };

  const isLast = currentIndex === TOTAL_ITEMS - 1;

  return (
    <Layout hideNav title="Assessment" hideFooter>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-paper">
          <div className="max-w-reading mx-auto px-6 py-5">
            <ProgressBar current={currentIndex + 1} total={TOTAL_ITEMS} />
          </div>
        </header>

        <main className="flex-1 max-w-reading mx-auto w-full px-6 py-12 md:py-16">
          <Card>
            <div ref={questionAreaRef} tabIndex={-1} className="outline-none">
              <QuestionRenderer
                key={question.id}
                question={question}
                value={currentAnswer}
                onChange={handleAnswerChange}
              />
            </div>
          </Card>

          {validationError && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-6 text-sm text-accent-deep bg-accent/5 border border-accent/20 rounded-md px-4 py-3"
            >
              {validationError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </Button>

            {/* Next button is always active. Validation happens on click. */}
            <Button onClick={handleNext}>
              {isLast ? "Finish" : "Next →"}
            </Button>
          </div>
        </main>
      </div>
    </Layout>
  );
}
