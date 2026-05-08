import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Hash, Lock, Users } from "lucide-react";
import type { ConversationVisibility } from "@/lib/conversations";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, visibility: ConversationVisibility) => void;
  isCreating: boolean;
};

const visibilityOptions: { value: ConversationVisibility; label: string; desc: string; icon: typeof Hash }[] = [
  { value: "public", label: "Pública", desc: "Todos os membros aprovados podem participar", icon: Hash },
  { value: "private", label: "Privada", desc: "Apenas membros adicionados manualmente", icon: Lock },
  { value: "internal", label: "Interna", desc: "Apenas a equipe da marca", icon: Users },
];

export default function CreateConversationDialog({ open, onClose, onCreate, isCreating }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ConversationVisibility>("public");

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Digite um nome para a conversa");
      return;
    }
    onCreate(title.trim(), description.trim(), visibility);
    setTitle("");
    setDescription("");
    setVisibility("public");
    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setVisibility("public");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-base">Nova conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da conversa</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Geral, Marketing, Suporte, VIP..."
              maxLength={60}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é essa conversa?"
              maxLength={200}
              rows={2}
              className="resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Visibilidade</label>
            <div className="space-y-2">
              {visibilityOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                      visibility === opt.value
                        ? "border-[#630091] bg-[#630091]/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      visibility === opt.value ? "bg-gradient-to-br from-[#630091] to-[#d81e62]" : "bg-gray-100"
                    }`}>
                      <Icon className={`h-4 w-4 ${visibility === opt.value ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${visibility === opt.value ? "text-[#630091]" : "text-gray-800"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="w-full h-10 bg-gradient-to-r from-[#630091] to-[#d81e62] hover:opacity-90"
          >
            {isCreating ? "Criando..." : "Criar conversa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
