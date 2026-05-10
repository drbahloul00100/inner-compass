import type { SubPrompt } from "@/types/question";
import type { TwoPartAnswer } from "@/types/response";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedText } from "@/lib/i18n";
import MultipleChoiceInput from "./MultipleChoiceInput";

interface TwoPartInputProps {
  subPrompts: SubPrompt[];
  value: TwoPartAnswer | undefined;
  onChange: (value: TwoPartAnswer) => void;
  itemId: number;
}

export default function TwoPartInput({
  subPrompts,
  value,
  onChange,
  itemId,
}: TwoPartInputProps) {
  const { lang, t } = useLanguage();
  const current = value ?? {};

  const handleSubChange = (subId: string, answer: string) => {
    onChange({ ...current, [subId]: answer });
  };

  return (
    <div className="space-y-12">
      {subPrompts.map((sub, index) => (
        <div
          key={sub.sub_id}
          className={
            index > 0
              ? "pt-12 border-t border-line"
              : ""
          }
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              {t.two_part.part_label(index + 1, subPrompts.length)}
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <p className="text-base md:text-lg text-ink mb-6 leading-relaxed">
            {getLocalizedText(sub.prompt, lang)}
          </p>
          <MultipleChoiceInput
            options={sub.options}
            value={current[sub.sub_id]}
            onChange={(answer) => handleSubChange(sub.sub_id, answer)}
            itemId={itemId}
            fieldName={`q${itemId}-${sub.sub_id}`}
          />
        </div>
      ))}
    </div>
  );
}
