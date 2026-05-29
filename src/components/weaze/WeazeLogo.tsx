import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "gradient" | "white" | "dark";
  withWordmark?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { h: 28 },
  md: { h: 36 },
  lg: { h: 48 },
  xl: { h: 72 },
};

export function WeazeLogo({
  size = "md",
  variant = "gradient",
  withWordmark = true,
  to = "/",
}: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <span className="inline-flex items-center gap-2 select-none">
      <img
        src="/logo-weaze.png"
        alt="WEAZE"
        height={s.h}
        className="w-auto object-contain"
        style={{ height: s.h }}
      />
      {withWordmark && (
        <span
          className={`font-extrabold tracking-tight text-lg ${
            variant === "white"
              ? "text-white"
              : variant === "dark"
                ? "text-foreground"
                : "text-brand-gradient"
          }`}
          style={{ fontSize: s.h * 0.65 }}
        >
          WEAZE
        </span>
      )}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="inline-flex items-center">
      {content}
    </Link>
  );
}
