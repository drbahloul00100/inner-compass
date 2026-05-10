import { HTMLAttributes } from "react";

export default function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-paper-card border border-line rounded-lg p-8 md:p-10 ${className}`}
      {...props}
    />
  );
}
