import { useLanguage } from "@/context/LanguageContext";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const { t } = useLanguage();
  const percent = Math.min(100, Math.round((current / total) * 100));
  const label = t.progress.label(current, total);

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div className="flex items-center justify-between mb-2 text-xs text-ink-mute">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1 bg-line rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
