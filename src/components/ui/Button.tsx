import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 ease-smooth disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

    const variants = {
      primary:
        "bg-accent text-paper-card border border-accent hover:bg-accent-deep hover:border-accent-deep hover:-translate-y-px shadow-sm hover:shadow",
      secondary:
        "bg-paper-card text-ink border border-line-strong hover:bg-paper-veil hover:border-ink-mute",
      ghost:
        "bg-transparent text-ink-soft hover:text-ink hover:bg-paper-veil",
    };

    const sizes = {
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
