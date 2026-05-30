import type { ReactNode } from "react";

export function isImageUrl(val: string) {
  return val.startsWith("data:image/") || val.startsWith("http");
}

export function GroupImage({ src, className }: { src: string; className?: string }): ReactNode {
  if (isImageUrl(src)) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover ${className || "h-10 w-10"}`}
      />
    );
  }
  return <span className={`shrink-0 ${className || "text-2xl"}`}>{src}</span>;
}
