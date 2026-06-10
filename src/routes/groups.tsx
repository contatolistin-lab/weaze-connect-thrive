import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Lock, Users, Plus, Copy, Check, Share2, ImageUp, ArrowRight, X } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { getMyGroups, getGroupMembers, createGroup } from "@/lib/mock-data";
import { GroupImage } from "@/lib/group-utils";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/groups") {
    return <Outlet />;
  }

  return <GroupsIndex />;
}

function GroupsIndex() {
  const nav = useNavigate();
  const { userType, hydrated } = useCommunity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [created, setCreated] = useState<{
    id: string;
    code: string;
    image: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "invite">("form");

  if (!hydrated) {
    return (
      <AppShell title="Grupos">
        <div className="min-h-[50dvh] grid place-items-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  const myGroups = getMyGroups();

  // B2C users with exactly one group go directly to it
  if (!userType.isB2B && myGroups.length === 1) {
    nav({ to: "/groups/$id", params: { id: myGroups[0].id }, replace: true });
    return null;
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setForm((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    const result = createGroup({
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image || "👥",
    });
    setCreated({
      id: result.id,
      code: result.inviteCode!,
      image: form.image || "👥",
      name: form.name.trim(),
    });
    setStep("invite");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/groups/invite/${created!.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    const link = `${window.location.origin}/groups/invite/${created!.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: created!.name, url: link });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleGoToGroup = () => {
    setModalOpen(false);
    setStep("form");
    setCreated(null);
    setImagePreview("");
    nav({ to: "/groups/$id", params: { id: created!.id } });
  };

  const handleCopyCardInvite = (e: React.MouseEvent, groupId: string, code: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/groups/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCardId(groupId);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const resetModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setStep("form");
      setCreated(null);
      setForm({ name: "", description: "", image: "" });
      setImagePreview("");
      setCopied(false);
    }, 200);
  };

  const inviteLink = created ? `${window.location.origin}/groups/invite/${created.code}` : "";

  const toolbar = (
    <div className="space-y-3">
      <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
        <p className="text-xs font-bold tracking-widest uppercase opacity-80">Seus grupos</p>
        <h2 className="mt-1 text-2xl font-extrabold">{myGroups.length} ativos</h2>
        <p className="text-sm opacity-90">Grupos privados que você participa</p>
        {userType.isB2B && (
          <div className="mt-3">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] h-9 px-4 text-sm bg-white text-[#8800aa] border border-white/30 shadow-soft hover:shadow-brand"
            >
              <Plus size={14} /> Criar grupo
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const groupList =
    myGroups.length === 0 ? (
      <div className="text-center py-16 text-foreground/50">
        <Users size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold">Você ainda não participa de nenhum grupo.</p>
        <p className="text-xs mt-1">
          {userType.isB2B
            ? "Crie um grupo privado ou aceite um convite para participar."
            : "Aceite um convite para participar de um grupo."}
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        {myGroups.map((g) => {
          const members = getGroupMembers(g.id);
          const admins = members.filter((m) => m.role === "admin");
          return (
            <button
              key={g.id}
              onClick={() => nav({ to: "/groups/$id", params: { id: g.id } })}
              className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border bg-white border-border shadow-soft"
            >
              <GroupImage src={g.image} className="h-11 w-11 shrink-0 rounded-full" />
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
              <div className="flex items-center gap-1 shrink-0">
                {g.inviteCode && userType.isB2B && (
                  <button
                    onClick={(e) => handleCopyCardInvite(e, g.id, g.inviteCode!)}
                    className="h-7 w-7 rounded-full bg-muted grid place-items-center hover:bg-foreground/10 transition-colors"
                    title="Copiar link de convite"
                  >
                    {copiedCardId === g.id ? (
                      <Check size={12} className="text-green-600" />
                    ) : (
                      <Share2 size={12} className="text-foreground/50" />
                    )}
                  </button>
                )}
                <span className="text-xs font-bold text-[#8800aa]">Abrir</span>
              </div>
            </button>
          );
        })}
      </div>
    );

  return (
    <>
      <div className="md:hidden">
        <AppShell title="Grupos">
          <div className="px-4 pt-3 space-y-3">
            {toolbar}
            {groupList}
          </div>
        </AppShell>
      </div>

      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 h-dvh">
          <div className="w-80 xl:w-96 shrink-0 overflow-y-auto scrollbar-brand space-y-4">
            {toolbar}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-brand pb-4">
            <div className="max-w-3xl">{groupList}</div>
          </div>
        </div>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) resetModal();
        }}
      >
        <DialogContent className="rounded-2xl max-w-sm">
          {step === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Criar Grupo</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um grupo privado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-2 block">
                    Imagem do Grupo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-border"
                          />
                          <button
                            onClick={handleClearImage}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground/60 text-white grid place-items-center"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="h-16 w-16 rounded-full bg-muted border-2 border-dashed border-border grid place-items-center cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <ImageUp size={20} className="text-foreground/40" />
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImagePick}
                        className="hidden"
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-brand-pink underline"
                    >
                      {imagePreview ? "Trocar foto" : "Carregar foto"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-1 block">
                    Nome do Grupo *
                  </label>
                  <Input
                    placeholder="Ex: Grupo VIP de Mentoria"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/60 mb-1 block">
                    Descrição *
                  </label>
                  <textarea
                    placeholder="Descreva o propósito do grupo..."
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
          ) : created ? (
            <>
              <DialogHeader>
                <DialogTitle>Grupo criado com sucesso!</DialogTitle>
                <DialogDescription>
                  Compartilhe o link abaixo com os membros que deseja convidar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
                  <GroupImage src={created.image} className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{created.name}</p>
                    <p className="text-[11px] text-foreground/40">Grupo privado</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/50 mb-1.5 block">
                    Link de convite exclusivo
                  </label>
                  <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-foreground/70 break-all select-all">
                      {inviteLink}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="h-8 w-8 rounded-full bg-white border border-border grid place-items-center shrink-0 hover:bg-muted transition-colors"
                      title="Copiar link"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <WButton variant="outline" className="flex-1" onClick={handleShareLink}>
                    <Share2 size={14} /> Compartilhar
                  </WButton>
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
                <WButton fullWidth onClick={handleGoToGroup}>
                  <ArrowRight size={16} /> Ir para o Grupo
                </WButton>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
