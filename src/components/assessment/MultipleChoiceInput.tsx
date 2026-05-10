import type { MultipleChoiceOption } from "@/types/question";

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
  const name = fieldName ?? `q${itemId}-mc`;
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Choose one option</legend>
      {options.map((option) => {
        const isSelected = value === option.option_id;
        const inputId = `${name}-${option.option_id}`;
        return (
          <label
            key={option.option_id}
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
              name={name}
              value={option.option_id}
              checked={isSelected}
              onChange={() => onChange(option.option_id)}
              className="mt-1 accent-accent"
            />
            <span className="text-ink leading-relaxed">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
