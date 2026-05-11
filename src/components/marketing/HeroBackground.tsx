import { memo } from "react";

// Decorative compass-rose background for the landing hero.
// Three concentric rings drift at different slow speeds (60s / 80s / 100s).
// Hidden on mobile for performance. Animation pauses when the user prefers
// reduced motion (via Tailwind's `motion-safe:` variant).
function HeroBackground() {
  const outerTicks = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * Math.PI * 2) / 16;
    return {
      x1: 400 + Math.cos(angle) * 370,
      y1: 400 + Math.sin(angle) * 370,
      x2: 400 + Math.cos(angle) * 380,
      y2: 400 + Math.sin(angle) * 380,
    };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block"
    >
      <svg
        className="absolute top-1/2 -translate-y-1/2 end-[-12%] w-[600px] h-[600px] md:w-[800px] md:h-[800px] text-accent"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.06">
          {/* Outer ring with tick marks — 60s clockwise */}
          <g
            className="motion-safe:animate-[spin_60s_linear_infinite]"
            style={{ transformOrigin: "400px 400px" }}
          >
            <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" />
            {outerTicks.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Middle ring — 80s counterclockwise */}
          <g
            className="motion-safe:animate-[spin_80s_linear_infinite_reverse]"
            style={{ transformOrigin: "400px 400px" }}
          >
            <circle cx="400" cy="400" r="260" stroke="currentColor" strokeWidth="1" />
          </g>

          {/* Inner ring with crossbars — 100s clockwise */}
          <g
            className="motion-safe:animate-[spin_100s_linear_infinite]"
            style={{ transformOrigin: "400px 400px" }}
          >
            <circle cx="400" cy="400" r="140" stroke="currentColor" strokeWidth="1" />
            <line x1="400" y1="260" x2="400" y2="540" stroke="currentColor" strokeWidth="1" />
            <line x1="260" y1="400" x2="540" y2="400" stroke="currentColor" strokeWidth="1" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default memo(HeroBackground);
