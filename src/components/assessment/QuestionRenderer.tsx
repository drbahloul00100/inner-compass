import type { FrontendQuestion } from "@/types/question";
import type {
  LikertAnswer,
  ResponseAnswer,
  TwoPartAnswer,
} from "@/types/response";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedText } from "@/lib/i18n";
import LikertInput from "./LikertInput";
import DirectionalLikertInput from "./DirectionalLikertInput";
import MultipleChoiceInput from "./MultipleChoiceInput";
import TwoPartInput from "./TwoPartInput";
import FreeTextInput from "./FreeTextInput";

interface QuestionRendererProps {
  question: FrontendQuestion;
  value: ResponseAnswer | undefined;
  onChange: (value: ResponseAnswer) => void;
}

export default function QuestionRenderer({
  question,
  value,
  onChange,
}: QuestionRendererProps) {
  const { lang } = useLanguage();

  // Item prompt — whitespace-pre-line preserves newlines from JSON.
  // Falls back to English if the active language has no translation yet.
  const prompt = (
    <p className="text-lg md:text-xl text-ink leading-[1.65] mb-8 md:mb-10 whitespace-pre-line">
      {getLocalizedText(question.user_facing_item, lang)}
    </p>
  );

  switch (question.answer_type) {
    case "likert":
      return (
        <div>
          {prompt}
          <LikertInput
            scaleLabels={question.options.scale_labels}
            value={value as LikertAnswer | undefined}
            onChange={(v) => onChange(v)}
            itemId={question.id}
          />
        </div>
      );

    case "directional_likert":
      return (
        <div>
          {prompt}
          <DirectionalLikertInput
            scaleLabels={question.options.scale_labels}
            value={value as LikertAnswer | undefined}
            onChange={(v) => onChange(v)}
            itemId={question.id}
          />
        </div>
      );

    case "multiple_choice":
      return (
        <div>
          {prompt}
          <MultipleChoiceInput
            options={question.options}
            value={value as string | undefined}
            onChange={(v) => onChange(v)}
            itemId={question.id}
          />
        </div>
      );

    case "two_part_multiple_choice":
      return (
        <div>
          {prompt}
          <TwoPartInput
            subPrompts={question.options.sub_prompts}
            value={value as TwoPartAnswer | undefined}
            onChange={(v) => onChange(v)}
            itemId={question.id}
          />
        </div>
      );

    case "free_text":
      return (
        <div>
          {prompt}
          <FreeTextInput
            options={question.options}
            value={value as string | undefined}
            onChange={(v) => onChange(v)}
            itemId={question.id}
          />
        </div>
      );

    default: {
      const _exhaustive: never = question;
      return _exhaustive;
    }
  }
}
