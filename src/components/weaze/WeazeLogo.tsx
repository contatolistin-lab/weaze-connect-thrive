import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  to?: string;
  variant?: "default" | "white";
}

const sizeMap = {
  sm: { h: 52 },
  md: { h: 72 },
  lg: { h: 100 },
  xl: { h: 140 },
};

export function WeazeLogo({ size = "md", to = "/", variant = "default" }: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <img
      src={variant === "white" ? "/logo-weaze-branco.png" : "/logo-weaze.png"}
      alt="WEAZE"
      height={s.h}
      className="w-auto object-contain"
      style={{ height: s.h }}
    />
  );

  if (!to) return content;
  return (
    <Link to={to} className="inline-flex items-center">
      {content}
    </Link>
  );
}
