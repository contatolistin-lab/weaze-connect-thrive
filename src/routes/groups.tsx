import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Users, Plus, Copy, Check } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { getMyGroups, getGroupMembers, createGroup } from "@/lib/mock-data";
import { useCommunity } from "@/lib/community-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Grupos — WEAZE" }] }),
  component: Groups,
});

function Groups() {
  const nav = useNavigate();
  const { userType } = useCommunity();
  const myGroups = getMyGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    const result = createGroup({
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim() || "👥",
    });
    setCreated({ id: result.id, code: result.inviteCode! });
    setForm({ name: "", description: "", image: "" });
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/groups/invite/${created!.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToGroup = (id: string) => {
    setModalOpen(false);
    setCreated(null);
    nav({ to: "/groups/$id", params: { id } });
  };

  return (
    <AppShell title="Grupos">
      <div className="px-4 pt-3 space-y-3">
        <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">Seus grupos</p>
          <h2 className="mt-1 text-2xl font-extrabold">{myGroups.length} ativos</h2>
          <p className="text-sm opacity-90">Grupos privados que você participa</p>
          {userType.isB2B && (
            <div className="mt-3">
              <WButton variant="white" size="sm" onClick={() => setModalOpen(true)}>
                <Plus size={14} /> Criar grupo
              </WButton>
            </div>
          )}
        </div>

        {myGroups.length === 0 ? (
          <div className="text-center py-16 text-foreground/50">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Você ainda não participa de nenhum grupo.</p>
            <p className="text-xs mt-1">
              {userType.isB2B
                ? "Crie um grupo privado e convide membros."
                : "Aceite um convite para entrar em um grupo privado."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {myGroups.map((g) => {
              const members = getGroupMembers(g.id);
              const admins = members.filter((m) => m.role === "admin");
              return (
                <button
                  key={g.id}
                  onClick={() => nav({ to: "/groups/$id", params: { id: g.id } })}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border bg-white border-border shadow-soft"
                >
                  <span className="text-3xl shrink-0">{g.image}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{g.name}</p>
                      <Lock size={11} className="text-foreground/40 shrink-0" />
                    </div>
                    <p className="text-[11px] text-foreground/60 line-clamp-1">{g.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground/40">
                      <span>{g.memberCount} membros</span>
                      {g.lastActivity && (
                        <>
                          <span>·</span>
                          <span>{g.lastActivity}</span>
                        </>
                      )}
                      {admins.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-brand-purple font-semibold">{admins[0].name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#d81e62] shrink-0">Abrir</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setCreated(null);
        }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          {!created ? (
            <>
              <DialogHeader>
                <DialogTitle>Criar Grupo</DialogTitle>
                <DialogDescription>Crie um grupo privado para seus membros.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-1 block">
                    Imagem
                  </label>
                  <Input
                    placeholder="🏠 (emoji)"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-1 block">
                    Nome do Grupo *
                  </label>
                  <Input
                    placeholder="Ex: Grupo VIP"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-1 block">
                    Descrição *
                  </label>
                  <textarea
                    placeholder="Descrição do grupo..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm resize-none h-20 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <WButton
                  fullWidth
                  onClick={handleCreate}
                  disabled={!form.name.trim() || !form.description.trim()}
                >
                  Criar Grupo
                </WButton>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Grupo criado!</DialogTitle>
                <DialogDescription>Compartilhe o link de convite com os membros.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs font-mono font-bold text-foreground/60 break-all">
                    {window.location.origin}/groups/invite/{created.code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <WButton variant="outline" className="flex-1" onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <Check size={14} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar Link
                      </>
                    )}
                  </WButton>
                </div>
                <WButton fullWidth onClick={() => handleGoToGroup(created.id)}>
                  Ir para o Grupo
                </WButton>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
