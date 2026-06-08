import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { WButton } from "./WButton";
import {
  useAddSupportMessage,
  supportTypeLabel,
  type SupportType,
} from "@/lib/support-store";
import { useCommunity, communityEmail } from "@/lib/community-store";
import { communitySlug } from "@/lib/support-store";

interface Props {
  open: boolean;
  type: SupportType | null;
  onClose: () => void;
}

export function SupportRequestModal({ open, type, onClose }: Props) {
  const { auth, community } = useCommunity();
  const addMessage = useAddSupportMessage();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject("");
      setMessage("");
      setError(null);
      setSent(false);
    }
  }, [open, type]);

  if (!open || !type) return null;

  const handleSend = () => {
    const s = subject.trim();
    const m = message.trim();
    if (!s) {
      setError("Informe o assunto.");
      return;
    }
    if (!m) {
      setError("Escreva sua mensagem.");
      return;
    }
    addMessage({
      community_id: communitySlug(community.name),
      user_id: auth.user?.email || "anonimo",
      user_name: auth.user?.name || "Usuário",
      user_email: auth.user?.email || communityEmail,
      type,
      subject: s,
      message: m,
    });
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-soft border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
              Central de Atendimento
            </p>
            <h2 className="text-base font-extrabold">
              {sent ? "Mensagem enviada" : supportTypeLabel[type]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <p className="font-bold">Mensagem enviada com sucesso.</p>
            <p className="text-sm text-foreground/60">
              Nossa equipe responderá em breve.
            </p>
            <WButton variant="gradient" size="md" fullWidth onClick={onClose}>
              Fechar
            </WButton>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">
                Assunto *
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Acesso ao grupo VIP"
                maxLength={120}
                className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#000000] bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">
                Mensagem *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva com detalhes…"
                rows={5}
                maxLength={2000}
                className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#000000] resize-none bg-white"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 font-semibold">{error}</p>
            )}
            <WButton variant="gradient" size="md" fullWidth onClick={handleSend}>
              Enviar Mensagem
            </WButton>
          </div>
        )}
      </div>
    </div>
  );
}
