import type { ScaleLabels } from "@/types/question";
import type { LikertAnswer } from "@/types/response";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedText } from "@/lib/i18n";

interface LikertInputProps {
  scaleLabels: ScaleLabels;
  value: LikertAnswer | undefined;
  onChange: (value: LikertAnswer) => void;
  itemId: number;
}

const SCALE: LikertAnswer[] = ["1", "2", "3", "4", "5"];

export default function LikertInput({
  scaleLabels,
  value,
  onChange,
  itemId,
}: LikertInputProps) {
  const { lang } = useLanguage();

  return (
    <fieldset className="space-y-2.5">
      <legend className="sr-only">Select your response</legend>
      {SCALE.map((s) => {
        const isSelected = value === s;
        const inputId = `q${itemId}-likert-${s}`;
        return (
          <label
            key={s}
            htmlFor={inputId}
            className={`group flex items-start gap-4 p-4 md:p-5 border rounded-md cursor-pointer transition-all duration-200 ease-smooth border-s-4 ${
              isSelected
                ? "border-line bg-accent/[0.04] border-s-accent"
                : "border-line bg-paper-card border-s-transparent hover:bg-paper-veil hover:border-line-strong"
            }`}
          >
            <input
              id={inputId}
              type="radio"
              name={`q${itemId}-likert`}
              value={s}
              checked={isSelected}
              onChange={() => onChange(s)}
              className="mt-1 accent-accent"
            />
            <span
              className={`leading-relaxed transition-colors duration-200 ${
                isSelected ? "text-ink font-medium" : "text-ink-soft group-hover:text-ink"
              }`}
            >
              {getLocalizedText(scaleLabels[s], lang)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
