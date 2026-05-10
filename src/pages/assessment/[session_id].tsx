import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/assessment/ProgressBar";
import QuestionRenderer from "@/components/assessment/QuestionRenderer";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();

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
          {t.assessment.loading}
        </div>
      </Layout>
    );
  }

  const question = QUESTIONS[currentIndex];
  if (!question) {
    return (
      <Layout>
        <div className="max-w-reading mx-auto px-6 py-20">
          {t.assessment.error}
        </div>
      </Layout>
    );
  }

  // Determine whether the current question has been adequately answered.
  // Item #32 (free_text) is always considered answered — blank is allowed.
  const isAnswered = (): boolean => {
    if (question.answer_type === "free_text") return true;
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
    // For free-text items: persist an empty string so the response exists in
    // storage, ensuring completion validation treats the item as complete.
    if (question.answer_type === "free_text") {
      if (currentAnswer === undefined) {
        persistAnswer("");
      }
    }

    if (!isAnswered()) {
      if (question.answer_type === "two_part_multiple_choice") {
        const missing = incompleteTwoPartSubs();
        const validationMsg =
          missing.length === 1
            ? t.assessment.validation_part_single(missing[0])
            : t.assessment.validation_parts_multiple(missing);
        setValidationError(validationMsg);
      } else {
        setValidationError(t.assessment.validation_choose);
      }
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
    setValidationError(t.assessment.validation_incomplete(incomplete.length));
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
              {t.assessment.prev}
            </Button>

            <Button onClick={handleNext}>
              {isLast ? t.assessment.finish : t.assessment.next}
            </Button>
          </div>
        </main>
      </div>
    </Layout>
  );
}
