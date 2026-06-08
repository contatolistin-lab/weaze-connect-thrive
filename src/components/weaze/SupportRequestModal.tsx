import { useState } from "react";
import { useSupportMessages, SupportType } from "@/hooks/useSupportMessages";
import { WButton } from "./WButton";

type Props = {
  open: boolean;
  onClose: () => void;
  communityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  defaultType: SupportType;
};

const typeLabels: Record<SupportType, string> = {
  duvida: "Enviar Dúvida",
  sugestao: "Enviar Sugestão",
  problema: "Reportar Problema",
};

export function SupportRequestModal({ open, onClose, communityId, userId, userName, userEmail, defaultType }: Props) {
  const { create } = useSupportMessages();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    if (!message.trim()) return;

    setSending(true);
    create({
      community_id: communityId,
      user_id: userId,
      user_name: userName || "Usuário",
      user_email: userEmail,
      type: defaultType,
      subject: subject.trim(),
      message: message.trim(),
    });
    setSending(false);
    setSubject("");
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">{typeLabels[defaultType]}</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Assunto *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Digite o assunto"
              maxLength={200}
              className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#000000] bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">Mensagem *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem"
              rows={5}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#000000] resize-none bg-white"
            />
          </div>
          <WButton variant="gradient" size="md" fullWidth onClick={handleSubmit} disabled={sending}>
            {sending ? "Enviando..." : "Enviar Mensagem"}
          </WButton>
        </div>
      </div>
    </div>
  );
}
