interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  ring?: boolean;
  brand?: boolean;
}

function colorFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette = ["#630091", "#d81e62", "#8a2be2", "#ff4d8d", "#5b21b6", "#be185d"];
  return palette[h % palette.length];
}

export function Avatar({ name = "?", src, size = 40, ring, brand }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = brand ? "linear-gradient(135deg,#630091,#d81e62)" : colorFromName(name);
  const wrapperStyle: React.CSSProperties = ring
    ? { padding: 2, background: "linear-gradient(135deg,#630091,#d81e62)", borderRadius: "9999px" }
    : {};
  const inner = (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-bold overflow-hidden bg-muted"
      style={{
        width: size,
        height: size,
        background: src ? undefined : bg,
        fontSize: size * 0.38,
      }}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </span>
  );
  if (ring)
    return (
      <span style={wrapperStyle} className="inline-flex">
        <span className="block bg-white rounded-full p-[2px]">{inner}</span>
      </span>
    );
  return inner;
}
