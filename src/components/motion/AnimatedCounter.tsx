import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

// Tweens an integer from 0 to `value` over `duration` seconds when the element
// scrolls into view. Respects prefers-reduced-motion by jumping to the final
// value immediately. Always renders the final value as plain text after the
// animation completes — accessible and copy-paste friendly.
export default function AnimatedCounter({ value, duration = 1.2 }: AnimatedCounterProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
