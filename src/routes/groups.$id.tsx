import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Globe, Heart, MessageSquare, Plus, Copy, Share2, Check } from "lucide-react";
import {
  getGroup,
  getGroupTopics,
  isGroupMember,
  joinGroup,
  groupInviteCodes,
} from "@/lib/mock-data";

export const Route = createFileRoute("/groups/$id")({
  head: () => ({ meta: [{ title: "Grupo — WEAZE" }] }),
  component: GroupDetail,
});

function GroupDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  const group = getGroup(id);
  const topics = getGroupTopics(id);
  const userIsMember = isGroupMember(id) || joined;
  const inviteCode = group?.privacy === "private" ? groupInviteCodes[id] : undefined;

  if (!group) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-extrabold">Grupo não encontrado</h1>
          <Link to="/groups" className="text-sm text-[#d81e62] font-semibold underline">Voltar</Link>
        </div>
      </div>
    );
  }

  if (group.privacy === "private" && !userIsMember) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <Lock size={32} className="mx-auto text-foreground/30" />
          <h1 className="text-xl font-extrabold">Grupo privado</h1>
          <p className="text-sm text-foreground/60">Você precisa de um convite para acessar este grupo.</p>
          <Link to="/groups" className="inline-flex h-10 px-6 rounded-full bg-brand-gradient text-white text-sm font-bold items-center shadow-brand">Voltar</Link>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    joinGroup(id);
    setJoined(true);
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    const url = window.location.origin + "/groups/invite/" + inviteCode;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareInvite = () => {
    if (!inviteCode) return;
    const url = window.location.origin + "/groups/invite/" + inviteCode;
    if (navigator.share) navigator.share({ url });
    else handleCopyInvite();
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
          <div className="flex items-center justify-between px-3 h-14">
            <div className="flex items-center gap-2">
              <button onClick={() => nav({ to: "/groups" })} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-sm truncate max-w-[200px]">Grupo</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <div className="flex items-start gap-3">
              <span className="text-4xl shrink-0">{group.emoji}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold">{group.name}</h1>
                <p className="text-sm text-foreground/60 mt-0.5">{group.topic}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground/50">
                  {group.privacy === "private" ? <Lock size={12} /> : <Globe size={12} />}
                  <span>{group.privacy === "private" ? "Privado" : "Público"}</span>
                  <span>·</span>
                  <span>{group.members} membros</span>
                  <span>·</span>
                  <span>{topics.length} tópicos</span>
                </div>
              </div>
            </div>

            {group.privacy === "public" && !userIsMember && (
              <button onClick={handleJoin} className="w-full mt-3 h-11 rounded-2xl bg-brand-gradient text-white font-bold text-sm shadow-brand">
                Entrar no Grupo
              </button>
            )}

            {group.privacy === "public" && userIsMember && (
              <div className="mt-3 text-xs text-center text-foreground/50 py-2 font-semibold bg-muted rounded-2xl">
                ✔ Você é membro deste grupo
              </div>
            )}

            {group.privacy === "private" && userIsMember && inviteCode && (
              <div className="mt-3 flex gap-2">
                <button onClick={handleCopyInvite} className="flex-1 h-10 rounded-xl bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Copy size={14} /> {copied ? "Copiado!" : "Copiar Link"}
                </button>
                <button onClick={handleShareInvite} className="flex-1 h-10 rounded-xl bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Share2 size={14} /> Compartilhar
                </button>
              </div>
            )}
          </div>

          <div className="px-4 pt-4 pb-20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                {topics.length} {topics.length === 1 ? "tópico" : "tópicos"}
              </p>
              {userIsMember && (
                <button className="text-xs font-semibold text-[#d81e62] flex items-center gap-1">
                  <Plus size={12} /> Novo tópico
                </button>
              )}
            </div>
            {topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white border border-border p-4 shadow-soft">
                    <p className="font-bold text-sm">{t.title}</p>
                    <p className="text-xs text-foreground/60 mt-1">por {t.author} · {t.createdAt}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-foreground/60">
                      <span className="flex items-center gap-1"><Heart size={12} /> {t.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {t.replies} respostas</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-foreground/50 text-sm">
                {userIsMember ? "Nenhum tópico ainda. Seja o primeiro!" : "Os tópicos do grupo aparecerão aqui."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
