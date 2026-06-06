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
    return (
      <a
        href={`https://wa.me/${number}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#128C7E] text-white shadow-lg hover:shadow-xl transition-shadow animate-float-in bottom-[90px] right-4 md:bottom-8 md:right-[calc((100vw-80px-448px)/2+16px)] lg:right-[calc((100vw-240px-448px)/2+16px)]"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    );
  } catch {
    return null;
  }
}
