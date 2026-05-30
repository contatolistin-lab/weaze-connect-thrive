import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Globe, Plus, X, Check, Copy, Share2 } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import {
  groups,
  groupTopics,
  isGroupMember,
  joinGroup,
  createGroup,
  groupInviteCodes,
} from "@/lib/mock-data";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Grupos — WEAZE" }] }),
  component: Groups,
});

function Groups() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<"todos" | "publicos" | "privados">("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", privacy: "public" as "public" | "private" });
  const [createdInfo, setCreatedInfo] = useState<{ id: string; inviteCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  const rerender = () => setTick((x) => x + 1);

  const filteredGroups = groups.filter((g) => {
    if (filter === "publicos") return g.privacy === "public";
    if (filter === "privados") return g.privacy === "private" && isGroupMember(g.id);
    if (filter === "todos") {
      if (g.privacy === "public") return true;
      return isGroupMember(g.id);
    }
    return true;
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const result = createGroup({
      name: form.name.trim(),
      description: form.description.trim(),
      privacy: form.privacy,
    });
    setCreatedInfo(result);
    setShowCreate(false);
    setForm({ name: "", description: "", privacy: "public" });
    rerender();
  };

  const handleJoin = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    joinGroup(groupId);
    rerender();
  };

  const handleCopyInvite = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const url = window.location.origin + "/groups/invite/" + code;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareInvite = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const url = window.location.origin + "/groups/invite/" + code;
    if (navigator.share) {
      navigator.share({ url });
    } else {
      handleCopyInvite(e, code);
    }
  };

  return (
    <AppShell title="Grupos">
      <div className="px-4 pt-3 space-y-3">
        <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">Seus grupos</p>
          <h2 className="mt-1 text-2xl font-extrabold">{groups.length} ativos</h2>
          <p className="text-sm opacity-90">{groupTopics.length} tópicos em discussão</p>
          <div className="mt-3">
            <WButton variant="white" size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Criar grupo
            </WButton>
          </div>
        </div>

        <div className="flex gap-2">
          {(["todos", "publicos", "privados"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 h-9 rounded-full text-sm font-semibold ${
                filter === t ? "bg-brand-gradient text-white" : "bg-muted"
              }`}
            >
              {t === "todos" ? "Todos" : t === "publicos" ? "Públicos" : "Privados"}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="w-full space-y-3">
            {filteredGroups.length === 0 && filter === "privados" && (
              <div className="text-center py-10 text-foreground/50 text-sm px-4 leading-relaxed">
                🔒 Você ainda não faz parte de nenhum grupo privado.<br />
                Quando receber um convite e entrar em um grupo privado, ele aparecerá aqui.
              </div>
            )}
            {filteredGroups.map((g) => {
              const topics = groupTopics.filter((t) => t.groupId === g.id);
              const userIsMember = isGroupMember(g.id);
              const inviteCode = g.privacy === "private" ? groupInviteCodes[g.id] : undefined;
              return (
                <div key={g.id} className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
                  <button
                    onClick={() => nav({ to: "/groups/$id", params: { id: g.id } })}
                    className="w-full text-left flex items-center gap-3 p-3"
                  >
                    <span className="text-2xl shrink-0">{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        {g.name}
                        {g.privacy === "private" ? (
                          <Lock size={12} className="text-foreground/50" />
                        ) : (
                          <Globe size={12} className="text-foreground/50" />
                        )}
                      </p>
                      <p className="text-[11px] text-foreground/60">
                        {g.topic} · {g.members} membros · {topics.length} tópicos
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#d81e62]">Acessar</span>
                  </button>

                  {g.privacy === "public" && !userIsMember && (
                    <div className="px-3 pb-3">
                      <button
                        onClick={(e) => handleJoin(e, g.id)}
                        className="w-full h-9 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-brand"
                      >
                        Entrar no Grupo
                      </button>
                    </div>
                  )}

                  {g.privacy === "private" && userIsMember && inviteCode && (
                    <div className="px-3 pb-3 flex gap-2">
                      <button
                        onClick={(e) => handleCopyInvite(e, inviteCode)}
                        className="flex-1 h-9 rounded-xl bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Copy size={14} /> {copied ? "Copiado!" : "Copiar Link"}
                      </button>
                      <button
                        onClick={(e) => handleShareInvite(e, inviteCode)}
                        className="flex-1 h-9 rounded-xl bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Share2 size={14} /> Compartilhar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg">Criar grupo</h3>
              <button onClick={() => setShowCreate(false)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do Grupo"
              className="w-full h-11 rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição do Grupo"
              rows={3}
              className="w-full rounded-xl border border-border p-4 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none"
            />
            <input
              placeholder="Imagem do Grupo (URL — opcional)"
              className="w-full h-11 rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
            />
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Tipo do Grupo</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setForm({ ...form, privacy: "public" })}
                  className={`flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    form.privacy === "public"
                      ? "bg-brand-gradient text-white border-transparent"
                      : "bg-white border-border text-foreground/70"
                  }`}
                >
                  <Globe size={14} /> Público
                </button>
                <button
                  onClick={() => setForm({ ...form, privacy: "private" })}
                  className={`flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    form.privacy === "private"
                      ? "bg-brand-gradient text-white border-transparent"
                      : "bg-white border-border text-foreground/70"
                  }`}
                >
                  <Lock size={14} /> Privado
                </button>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim() || !form.description.trim()}
              className="w-full h-11 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-brand disabled:opacity-50"
            >
              <Check size={16} /> Criar Grupo
            </button>
          </div>
        </div>
      )}

      {createdInfo && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-xl text-center">
            <div className="text-4xl">✅</div>
            <h3 className="font-extrabold text-lg">Grupo criado com sucesso!</h3>
            {createdInfo.inviteCode ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground/60">
                  Compartilhe o link abaixo para convidar membros:
                </p>
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                  <code className="flex-1 text-xs font-mono text-left break-all">
                    {window.location.origin}/groups/invite/{createdInfo.inviteCode}
                  </code>
                  <button
                    onClick={() => handleCopyInvite({} as any, createdInfo.inviteCode!)}
                    className="shrink-0 h-8 w-8 grid place-items-center rounded-lg bg-brand-gradient text-white"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <button
                  onClick={() => handleShareInvite({} as any, createdInfo.inviteCode!)}
                  className="w-full h-10 rounded-xl bg-muted text-foreground text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Share2 size={14} /> Compartilhar Link
                </button>
              </div>
            ) : (
              <p className="text-sm text-foreground/60">
                Seu grupo público já está disponível para todos na aba Todos e Públicos.
              </p>
            )}
            <button
              onClick={() => { setCreatedInfo(null); nav({ to: "/groups/$id", params: { id: createdInfo.id } }); }}
              className="w-full h-11 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-brand"
            >
              Ir para o Grupo
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
