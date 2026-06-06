import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  try {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("weaze_community");
    if (!saved) return null;
    const data = JSON.parse(saved);
    const raw = data.whatsapp;
    if (!raw) return null;
    const number = String(raw).replace(/\D/g, "");
    if (!number) return null;

    return <WhatsAppInner number={number} />;
  } catch {
    return null;
  }
}

function WhatsAppInner({ number }: { number: string }) {
  const [right, setRight] = useState(16);

  useEffect(() => {
    function update() {
      const container = document.querySelector<HTMLElement>(".mx-auto.max-w-md");
      if (container) {
        const rect = container.getBoundingClientRect();
        const offset = window.innerWidth - rect.right + 16;
        setRight(Math.max(offset, 16));
      } else {
        setRight(16);
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#128C7E] text-white shadow-lg hover:shadow-xl transition-shadow animate-float-in"
      style={{ bottom: 90, right }}
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
