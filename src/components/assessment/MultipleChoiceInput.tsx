import type { MultipleChoiceOption } from "@/types/question";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedText } from "@/lib/i18n";

interface MultipleChoiceInputProps {
  options: MultipleChoiceOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  itemId: number;
  fieldName?: string;
}

export default function MultipleChoiceInput({
  options,
  value,
  onChange,
  itemId,
  fieldName,
}: MultipleChoiceInputProps) {
  const { lang } = useLanguage();
  const name = fieldName ?? `q${itemId}-mc`;

  return (
    <fieldset className="space-y-2.5">
      <legend className="sr-only">Choose one option</legend>
      {options.map((option) => {
        const isSelected = value === option.option_id;
        const inputId = `${name}-${option.option_id}`;
        return (
          <label
            key={option.option_id}
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
              name={name}
              value={option.option_id}
              checked={isSelected}
              onChange={() => onChange(option.option_id)}
              className="mt-1 accent-accent"
            />
            <span
              className={`leading-relaxed transition-colors duration-200 ${
                isSelected ? "text-ink font-medium" : "text-ink-soft group-hover:text-ink"
              }`}
            >
              {getLocalizedText(option.label, lang)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
