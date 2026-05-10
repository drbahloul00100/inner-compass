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
    <fieldset className="space-y-3">
      <legend className="sr-only">Select your response</legend>
      {SCALE.map((s) => {
        const isSelected = value === s;
        const inputId = `q${itemId}-likert-${s}`;
        return (
          <label
            key={s}
            htmlFor={inputId}
            className={`flex items-start gap-4 p-4 border rounded-md cursor-pointer transition-all ${
              isSelected
                ? "border-accent bg-accent/5"
                : "border-line bg-paper-card hover:border-ink-mute"
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
            <span className="text-ink leading-relaxed">
              {getLocalizedText(scaleLabels[s], lang)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
