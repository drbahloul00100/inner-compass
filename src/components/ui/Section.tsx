import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  divided?: boolean;
  spacing?: "default" | "tight" | "spacious";
  className?: string;
}

export default function Section({
  children,
  divided = false,
  spacing = "default",
  className = "",
}: SectionProps) {
  const padding =
    spacing === "tight"
      ? "py-14 md:py-20"
      : spacing === "spacious"
      ? "py-24 md:py-32"
      : "py-20 md:py-28";

  const border = divided ? "border-t border-line" : "";

  return (
    <section className={`max-w-reading mx-auto px-6 ${padding} ${border} ${className}`}>
      {children}
    </section>
  );
}
