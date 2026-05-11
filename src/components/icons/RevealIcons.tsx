// Inline SVG icons for the six reveal cards on the landing page.
// All icons are stroke-based, 24x24, use currentColor, and are symmetric so
// they render identically in LTR and RTL layouts.

interface IconProps {
  className?: string;
}

const sharedProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PressureSignatureIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <path d="M3 7q3 -3 6 0 t 6 0 t 6 0" />
      <path d="M3 12q3 -3 6 0 t 6 0 t 6 0" />
      <path d="M3 17q3 -3 6 0 t 6 0 t 6 0" />
    </svg>
  );
}

export function InnerDriverIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,4.5 14,12 12,19.5 10,12" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DecisionArchitectureIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M12 7v3M12 10l-5 7M12 10l5 7" />
    </svg>
  );
}

export function EmotionalSystemIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function RelationshipPatternIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <circle cx="6" cy="8" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 8h8" />
      <path d="M7.5 9.5l3 7" />
      <path d="M16.5 9.5l-3 7" />
    </svg>
  );
}

export function LeadershipFootprintIcon({ className }: IconProps) {
  return (
    <svg className={className} {...sharedProps}>
      <rect x="3" y="5" width="18" height="3" rx="1" />
      <rect x="5" y="10.5" width="14" height="3" rx="1" />
      <rect x="7" y="16" width="10" height="3" rx="1" />
    </svg>
  );
}
