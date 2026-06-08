import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSupportMessages, SupportType } from "@/hooks/useSupportMessages";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  defaultType: SupportType;
};

const typeLabels: Record<SupportType, string> = {
  duvida: "Dúvida",
  sugestao: "Sugestão",
  problema: "Problema",
};

export default function SupportRequestModal({ open, onOpenChange, communityId, userId, userName, userEmail, defaultType }: Props) {
  const { create } = useSupportMessages();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error("Preencha o assunto");
      return;
    }
    if (!message.trim()) {
      toast.error("Preencha a mensagem");
      return;
    }

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
    onOpenChange(false);
    toast.success("Mensagem enviada com sucesso. Nossa equipe responderá em breve.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{typeLabels[defaultType]}</DialogTitle>
          <DialogDescription>Envie sua mensagem para a equipe da comunidade.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Digite o assunto"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem"
              rows={5}
            />
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
