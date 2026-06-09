import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "gradient" | "purple" | "pink" | "ghost" | "outline" | "white";
type Size = "sm" | "md" | "lg" | "xl";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-base",
};

export const WButton = forwardRef<HTMLButtonElement, Props>(function WButton(
  {
    variant = "gradient",
    size = "md",
    fullWidth,
    loading,
    className = "",
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const variants: Record<Variant, string> = {
    gradient:
      "bg-[#8800aa] text-white shadow-brand hover:shadow-pink focus-visible:ring-[--brand-pink]",
    purple: "bg-[#8800aa] text-white hover:opacity-90 shadow-brand",
    pink: "bg-[#8800aa] text-white hover:opacity-90 shadow-pink",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    outline: "bg-[#8800aa] text-white border border-border hover:bg-muted",
    white: "bg-[#8800aa] text-white shadow-soft hover:shadow-brand",
  };
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        children
      )}
    </button>
  );
});
