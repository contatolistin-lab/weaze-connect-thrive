import { MessageCircle } from "lucide-react";
import { useCommunity } from "@/lib/community-store";

export function WhatsAppButton() {
  const { community, userType } = useCommunity();

  if (userType.isB2B) return null;
  if (!community.whatsapp) return null;

  const number = community.whatsapp.replace(/\D/g, "");
  if (!number) return null;

  const href = `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full bg-brand-gradient text-white shadow-brand hover:shadow-pink transition-shadow animate-float-in"
      style={{ bottom: 90, right: 16 }}
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
