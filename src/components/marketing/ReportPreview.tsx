import { useLanguage } from "@/context/LanguageContext";

// Mock report preview shown on the landing page. Visual only — no real
// data, no real scoring. Sections, labels, and example text are clearly
// marked as illustrative ("Preview" badge, "[Example]" prefix on body copy).
export default function ReportPreview() {
  const { t } = useLanguage();

  const bars = [
    { label: t.home.preview_bar1_label, value: 78 },
    { label: t.home.preview_bar2_label, value: 64 },
    { label: t.home.preview_bar3_label, value: 52 },
  ];

  return (
    <div className="relative">
      {/* Preview badge — top-end (logical, mirrors in RTL) */}
      <div className="absolute top-4 end-4 z-10">
        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent bg-accent/5 border border-accent/20 rounded-full">
          {t.home.preview_label}
        </span>
      </div>

      {/* Mock report card */}
      <div className="bg-paper-card border border-line rounded-lg p-6 sm:p-8 md:p-10 shadow-card space-y-8">
        {/* Executive summary */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute mb-3">
            {t.home.preview_exec_label}
          </h3>
          <p className="text-base md:text-lg text-ink leading-[1.7]">
            {t.home.preview_exec_body}
          </p>
        </div>

        {/* At a glance */}
        <div className="border-t border-line pt-7">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute mb-4">
            {t.home.preview_glance_label}
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            <div>
              <dt className="text-xs text-ink-mute mb-1">
                {t.home.preview_glance_signature_label}
              </dt>
              <dd className="text-sm font-medium text-ink">
                {t.home.preview_glance_signature}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute mb-1">
                {t.home.preview_glance_driver_label}
              </dt>
              <dd className="text-sm font-medium text-ink">
                {t.home.preview_glance_driver}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute mb-1">
                {t.home.preview_glance_recovery_label}
              </dt>
              <dd className="text-sm font-medium text-ink">
                {t.home.preview_glance_recovery}
              </dd>
            </div>
          </dl>
        </div>

        {/* Primary signature with illustrative bars */}
        <div className="border-t border-line pt-7">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute mb-3">
            {t.home.preview_signature_label}
          </h3>
          <p className="text-sm text-ink-soft leading-relaxed mb-5">
            {t.home.preview_signature_body}
          </p>
          <div className="space-y-3">
            {bars.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="w-28 sm:w-36 text-ink-mute truncate">{b.label}</span>
                <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full"
                    style={{ width: `${b.value}%` }}
                  />
                </div>
                <span className="w-8 text-ink-faint tabular-nums text-end">
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Development plan */}
        <div className="border-t border-line pt-7">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute mb-3">
            {t.home.preview_devplan_label}
          </h3>
          <p className="text-sm text-ink-soft leading-relaxed">
            {t.home.preview_devplan_body}
          </p>
        </div>
      </div>
    </div>
  );
}
