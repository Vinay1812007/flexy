import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "icon";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-emerald-400 to-cyan-500 text-black hover:brightness-110 active:scale-[0.98]",
  secondary:
    "bg-white/10 text-white border border-white/15 hover:bg-white/15 backdrop-blur",
  ghost: "text-white/80 hover:text-white hover:bg-white/10",
  icon: "text-white/80 hover:text-white hover:bg-white/10 rounded-full",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-full",
  md: "h-10 px-4 text-sm rounded-full",
  lg: "h-12 px-6 text-base font-semibold rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          variant === "icon" ? "h-10 w-10 p-0" : sizes[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
