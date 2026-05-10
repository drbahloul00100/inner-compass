import type { FreeTextOptions } from "@/types/question";

interface FreeTextInputProps {
  options: FreeTextOptions;
  value: string | undefined;
  onChange: (value: string) => void;
  itemId: number;
}

export default function FreeTextInput({
  options,
  value,
  onChange,
  itemId,
}: FreeTextInputProps) {
  const current = value ?? "";

  return (
    <div className="space-y-3">
      <textarea
        id={`q${itemId}-free-text`}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={options.soft_max_chars}
        placeholder="Take your time."
        className="w-full p-4 border border-line rounded-md bg-paper-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors resize-y"
        aria-describedby={`q${itemId}-free-text-help`}
      />
      <p
        id={`q${itemId}-free-text-help`}
        className="text-sm text-ink-mute italic"
      >
        One or two honest sentences is enough. This will not appear in your
        report.
      </p>
      <p className="text-xs text-ink-faint">
        {current.length} / {options.soft_max_chars} characters
      </p>
    </div>
  );
}
