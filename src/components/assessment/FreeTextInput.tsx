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
        rows={6}
        maxLength={options.soft_max_chars}
        placeholder={t.free_text.placeholder}
        className="w-full p-5 md:p-6 border border-line rounded-md bg-paper-warm text-ink leading-relaxed placeholder:text-ink-faint focus:outline-none focus:border-accent focus:bg-paper-card transition-colors duration-200 resize-y min-h-[180px]"
        aria-describedby={`q${itemId}-free-text-help`}
      />
      <div className="flex items-start justify-between gap-4 text-xs">
        <p
          id={`q${itemId}-free-text-help`}
          className="text-ink-mute italic leading-relaxed"
        >
          {t.free_text.help}
        </p>
        <p className="text-ink-faint tabular-nums whitespace-nowrap pt-0.5">
          {t.free_text.char_count(current.length, options.soft_max_chars)}
        </p>
      </div>
    </div>
  );
}
