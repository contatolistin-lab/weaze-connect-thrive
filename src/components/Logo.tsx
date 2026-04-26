import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** altura em pixels (largura ajusta proporcionalmente) */
  size?: number;
  alt?: string;
};

export default function Logo({ className, size = 32, alt = "Wenity" }: Props) {
  return (
    <img
      src={logo}
      alt={alt}
      height={size}
      style={{ height: size, width: "auto" }}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
