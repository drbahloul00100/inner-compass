import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "elevated";
}

export default function Card({
  variant = "flat",
  className = "",
  ...props
}: CardProps) {
  const base = "bg-paper-card border border-line rounded-lg p-8 md:p-10";
  const elevation = variant === "elevated" ? "shadow-card" : "";
  return (
    <div
      className={`${base} ${elevation} ${className}`}
      {...props}
    />
  );
}
