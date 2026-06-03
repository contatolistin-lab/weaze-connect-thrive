import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Info, Pin, LogOut, ChevronDown, Share2, Copy, Check, Lock } from "lucide-react";
import {
  getGroup,
  getGroupMembers,
  getGroupMessages,
  getPinnedMessage,
  sendMessage,
  leaveGroup,
  pinMessage,
  unpinMessage,
  currentUserId,
  getMyGroups,
  isGroupMember,
  type MockGroupMessage,
} from "@/lib/mock-data";
import { WButton } from "@/components/weaze/WButton";
import { Avatar } from "@/components/weaze/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GroupImage } from "@/lib/group-utils";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/groups/$id")({
  head: () => ({ meta: [{ title: "Grupo — WEAZE" }] }),
  component: GroupChat,
});

function GroupChat() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const group = getGroup(id);
  const members = getGroupMembers(id);
  const messages = getGroupMessages(id);
  const pinnedMsg = getPinnedMessage(id);

  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<MockGroupMessage[]>(messages);

  useEffect(() => {
    setMsgs(getGroupMessages(id));
  }, [id]);
  const [showInfo, setShowInfo] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(dist > 200);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (dist < 50) scrollToBottom();
  }, [msgs.length]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = sendMessage(id, text.trim());
    setMsgs((prev) => [...prev, msg]);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLeave = () => {
    leaveGroup(id);
    nav({ to: "/groups" });
  };

  const handlePinMessage = (msgId: string) => {
    pinMessage(id, msgId);
    setMsgs((prev) =>
      prev.map((m) => ({
        ...m,
        isPinned: m.id === msgId ? true : false,
      })),
    );
  };

  const handleUnpin = () => {
    unpinMessage(id);
    setMsgs((prev) => prev.map((m) => ({ ...m, isPinned: false })));
  };

  const handleCopyInvite = () => {
    if (!group?.inviteCode) return;
    const link = `${window.location.origin}/groups/invite/${group.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const { userType, hydrated } = useCommunity();

  if (!group) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-extrabold">Grupo não encontrado</h1>
          <button
            onClick={() => nav({ to: "/groups" })}
            className="text-sm text-[#d81e62] font-semibold underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (hydrated && !userType.isB2B && !isGroupMember(id)) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-extrabold">Acesso restrito</h1>
          <p className="text-sm text-foreground/60">
            Você só pode acessar grupos pelos quais foi convidado.
          </p>
          <button
            onClick={() => nav({ to: "/groups" })}
            className="text-sm text-[#d81e62] font-semibold underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const adminMember = members.find((m) => m.role === "admin");

  const myGroups = getMyGroups ? getMyGroups() : [];

  const chatPanel = (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-brand"
        style={{ background: "#f0edf3" }}
      >
        {pinnedMsg && (
          <div className="bg-white/90 backdrop-blur rounded-xl border border-border p-3 shadow-soft flex items-start gap-2">
            <Pin size={14} className="text-brand-pink shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-pink uppercase tracking-wider">
                Fixado
              </p>
              <p className="text-xs mt-0.5 line-clamp-2">{pinnedMsg.text}</p>
              {isAdmin && (
                <button
                  onClick={handleUnpin}
                  className="text-[10px] text-foreground/40 font-semibold mt-1 underline"
                >
                  Desafixar
                </button>
              )}
            </div>
          </div>
        )}

        {msgs
          .filter((m) => !m.isPinned)
          .map((msg, i, arr) => {
            const isOwn = msg.authorId === currentUserId;
            const isAdminAuthor =
              msg.authorId !== currentUserId &&
              members.find((m) => m.userId === msg.authorId)?.role === "admin";
            const prev = arr[i - 1];
            const showAvatar =
              i === 0 || !prev || prev.authorId !== msg.authorId;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 animate-float-in",
                  isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div className="shrink-0 self-end">
                  {showAvatar && !isOwn ? (
                    <Avatar name={msg.authorName} size={30} />
                  ) : (
                    <div className="w-[30px]" />
                  )}
                </div>

                <div className={cn("max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                  {showAvatar && isAdminAuthor && (
                    <p className="text-[10px] font-bold text-brand-purple mb-0.5">
                      👑 {msg.authorName}
                    </p>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed relative group",
                      isOwn
                        ? "bg-brand-gradient text-white rounded-br-md"
                        : "bg-white border border-border shadow-soft rounded-bl-md",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        isOwn ? "text-white/70" : "text-foreground/40",
                      )}
                    >
                      <span className="text-[10px] font-medium">{msg.createdAt}</span>
                      {isAdmin && !isOwn && (
                        <button
                          onClick={() => handlePinMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Fixar mensagem"
                        >
                          <Pin size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border border-border shadow-soft grid place-items-center"
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      <div className="border-t border-border bg-white">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite sua mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-10 rounded-2xl bg-muted px-4 text-sm outline-none placeholder:text-foreground/40"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-10 w-10 rounded-full bg-brand-gradient text-white grid place-items-center shrink-0 disabled:opacity-40 shadow-brand"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden min-h-dvh bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
          <div className="flex items-center gap-2 px-2 h-14">
            <button
              onClick={() => nav({ to: "/groups" })}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <GroupImage src={group.image} className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{group.name}</p>
                <p className="text-[11px] text-foreground/40">{group.memberCount} membros</p>
              </div>
            </button>
            <button
              onClick={() => setShowInfo(true)}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted shrink-0"
            >
              <Info size={19} className="text-foreground/60" />
            </button>
          </div>
        </header>
        {chatPanel}
      </div>

      {/* Desktop/tablet layout - dashboard */}
      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 h-dvh">
          <div className="w-80 xl:w-96 shrink-0 space-y-4 overflow-y-auto scrollbar-brand">
            <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Seus grupos</p>
              <h2 className="mt-1 text-2xl font-extrabold">{myGroups.length} ativos</h2>
              <p className="text-sm opacity-90">Grupos privados que você participa</p>
            </div>
            <div className="space-y-2">
              {myGroups.map((g2) => (
                <button
                  key={g2.id}
                  onClick={() => nav({ to: "/groups/$id", params: { id: g2.id } })}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border bg-white shadow-soft ${
                    g2.id === id ? "border-brand-pink ring-1 ring-brand-pink" : "border-border"
                  }`}
                >
                  <GroupImage src={g2.image} className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{g2.name}</p>
                    <p className="text-[10px] text-foreground/40">{g2.memberCount} membros</p>
                  </div>
                  <span className="text-xs font-bold text-[#d81e62]">Abrir</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-3xl border border-border shadow-soft flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 bg-white">
              <GroupImage src={group.image} className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{group.name}</p>
                <p className="text-[10px] text-foreground/40">{group.memberCount} membros</p>
              </div>
              <button
                onClick={() => setShowInfo(true)}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted shrink-0"
              >
                <Info size={18} className="text-foreground/60" />
              </button>
            </div>
            {chatPanel}
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Informações do Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <GroupImage src={group.image} className="h-16 w-16 mx-auto rounded-full" />
              <h3 className="font-extrabold text-lg mt-2">{group.name}</h3>
              <p className="text-sm text-foreground/60 mt-1">{group.description}</p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/40 mt-2">
                <Lock size={12} />
                <span>Privado</span>
                <span>·</span>
                <span>{group.memberCount} membros</span>
                <span>·</span>
                <span>Criado em {group.createdAt}</span>
              </div>
              {adminMember && (
                <p className="text-xs text-foreground/40 mt-1">
                  Administrador:{" "}
                  <span className="font-semibold text-brand-purple">{adminMember.name}</span>
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                Membros ({members.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-1.5">
                    <Avatar name={m.name} size={32} brand={m.role === "admin"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        {m.role === "admin" && (
                          <span className="text-[10px] bg-brand-gradient text-white px-1.5 py-0.5 rounded-full font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-foreground/40">Entrou em {m.joinedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {isAdmin && group.inviteCode && (
                <WButton variant="outline" fullWidth className="text-xs" onClick={handleCopyInvite}>
                  {copiedLink ? (
                    <>
                      <Check size={14} /> Link copiado!
                    </>
                  ) : (
                    <>
                      <Share2 size={14} /> Compartilhar convite
                    </>
                  )}
                </WButton>
              )}
              <button
                onClick={handleLeave}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut size={15} /> Sair do grupo
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
