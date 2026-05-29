import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "gradient" | "white" | "dark";
  withWordmark?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { box: 28, text: "text-lg" },
  md: { box: 36, text: "text-xl" },
  lg: { box: 48, text: "text-2xl" },
  xl: { box: 72, text: "text-4xl" },
};

export function WeazeLogo({
  size = "md",
  variant = "gradient",
  withWordmark = true,
  to = "/",
}: LogoProps) {
  const s = sizeMap[size];
  const fill =
    variant === "white" ? "#ffffff" : variant === "dark" ? "#0b0b12" : "url(#weaze-grad)";
  const textClass =
    variant === "white"
      ? "text-white"
      : variant === "dark"
        ? "text-foreground"
        : "text-brand-gradient";

  const content = (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={s.box} height={s.box} viewBox="0 0 64 64" fill="none" aria-hidden>
        <defs>
          <linearGradient
            id="weaze-grad"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#630091" />
            <stop offset="100%" stopColor="#d81e62" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill={fill} />
        <path
          d="M14 22 L22 46 L29 30 L36 46 L44 22 L40 22 L34 38 L29 22 L25 22 L20 38 L18 22 Z"
          fill="#ffffff"
        />
        <circle cx="50" cy="18" r="4" fill="#ffffff" />
      </svg>
      {withWordmark && (
        <span className={`font-extrabold tracking-tight ${s.text} ${textClass}`}>WEAZE</span>
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
