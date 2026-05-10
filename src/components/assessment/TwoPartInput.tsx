import type { SubPrompt } from "@/types/question";
import type { TwoPartAnswer } from "@/types/response";
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
  const current = value ?? {};

  const handleSubChange = (subId: string, answer: string) => {
    onChange({ ...current, [subId]: answer });
  };

  return (
    <div className="space-y-10">
      {subPrompts.map((sub, index) => (
        <div key={sub.sub_id}>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-accent">
              Part {index + 1} of {subPrompts.length}
            </span>
          </div>
          <p className="text-base text-ink mb-5 leading-relaxed">
            {sub.prompt}
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
