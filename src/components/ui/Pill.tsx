import { HTMLAttributes } from "react";

export default function Pill({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-ink-soft bg-paper-veil border border-line rounded-full ${className}`}
      {...props}
    />
  );
}
