import type { FreeTextOptions } from "@/types/question";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
  const current = value ?? "";

  return (
    <div className="space-y-3">
      <textarea
        id={`q${itemId}-free-text`}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={options.soft_max_chars}
        placeholder={t.free_text.placeholder}
        className="w-full p-4 border border-line rounded-md bg-paper-card text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors resize-y"
        aria-describedby={`q${itemId}-free-text-help`}
      />
      <p
        id={`q${itemId}-free-text-help`}
        className="text-sm text-ink-mute italic"
      >
        {t.free_text.help}
      </p>
      <p className="text-xs text-ink-faint">
        {t.free_text.char_count(current.length, options.soft_max_chars)}
      </p>
    </div>
  );
}
