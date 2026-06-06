import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect, useReducer } from "react";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Send,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  Search,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import {
  getConversation,
  getConversationComments,
  addConversationComment,
  updateConversationComment,
  deleteConversationComment,
  likeConversation,
  unlikeConversation,
  viewConversation,
  getAllConversations,
  addUserConversation,
  togglePinConversation,
  deleteConversation,
} from "@/lib/mock-data";
import { useCommunity } from "@/lib/community-store";
import { Avatar } from "@/components/weaze/Avatar";

function ConversationDetailError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-xl font-extrabold">Esta conversa não carregou</h1>
        <p className="text-sm text-foreground/60">Tente novamente ou volte para a lista de conversas.</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="h-10 px-4 rounded-xl bg-white text-[#000000] text-sm font-bold shadow-brand"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.history.push("/conversas")}
            className="h-10 px-4 rounded-xl border border-border bg-white text-sm font-bold"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/conversas/$id")({
  head: () => ({ meta: [{ title: "Conversa — WEAZE" }] }),
  component: ConversationDetail,
  errorComponent: ConversationDetailError,
});

const CURRENT_USER = "Você";

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeReplies<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function ConversationDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { profileAvatar } = useCommunity();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [conv, setConv] = useState(() => getConversation(id) ?? null);
  const [liked, setLiked] = useState(false);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [comments, setComments] = useState(() => getConversationComments(id));
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({});

  useEffect(() => {
    viewConversation(id);
    setConv(getConversation(id) ?? null);
    setComments([...getConversationComments(id)]);
  }, [id]);

  const refresh = () => {
    setConv(getConversation(id) ?? null);
    setComments([...getConversationComments(id)]);
    forceUpdate();
  };

  if (!conv) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center">
        <div className="text-center">
          <p className="text-foreground/50">Conversa não encontrada.</p>
          <button
            onClick={() => nav({ to: "/conversas" })}
            className="mt-3 text-sm text-[#000000] font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const text = (editingId ? editText : input).trim();
    if (!text) return;
    if (editingId) {
      updateConversationComment(editingId, text);
      setEditingId(null);
      setEditText("");
    } else {
      addConversationComment(id, text);
      setInput("");
    }
    refresh();
  };

  const handleReply = (commentId: string) => {
    const text = replyContent.trim();
    if (!text) return;
    setComments((prev) =>
      prev.map((cm) =>
        cm.id === commentId
          ? {
              ...cm,
              replies: [
                ...safeReplies(cm.replies),
                { author: CURRENT_USER, text, createdAt: "agora", likes: 0 },
              ],
            }
          : cm,
      ),
    );
    setReplyContent("");
    setReplyingTo(null);
    refresh();
  };

  const handleDelete = (commentId: string) => {
    deleteConversationComment(commentId, id);
    refresh();
  };

  const conversationDetail = (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-brand">
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <h1 className="text-xl font-extrabold tracking-tight leading-snug">{safeText(conv.title, "Nova conversa")}</h1>
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{safeText(conv.description)}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-foreground/60">
            <Avatar
              name={safeText(conv.author, "Você")}
              size={24}
              src={safeText(conv.author, "Você") === "Você" ? profileAvatar : undefined}
            />
            <span className="font-semibold text-foreground/80">{safeText(conv.author, "Você")}</span>
            <span>·</span>
            <span>{safeText(conv.createdAt, "agora")}</span>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-foreground/60">
            <span className="flex items-center gap-1">
              <Heart size={14} /> {conv.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={14} /> {conv.replies} respostas
            </span>
            <span className="flex items-center gap-1">
              <Eye size={14} /> {conv.views} visualizações
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {(Array.isArray(conv.tags) ? conv.tags : []).map((t, i) => (
              <span
                key={t + i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient-soft text-[#000000] font-semibold"
              >
                #{t}
              </span>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (liked) {
                  unlikeConversation(conv.id);
                } else {
                  likeConversation(conv.id);
                }
                setLiked((v) => !v);
                refresh();
              }}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                liked
                  ? "bg-[#000000] text-white border-[#000000]"
                  : "bg-white border-border text-foreground/70"
              }`}
            >
              <Heart size={16} fill={liked ? "white" : "none"} /> {conv.likes}
            </button>
          </div>
        </div>

        <div className="px-4 pt-4 pb-4">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">
            {comments.length} {comments.length === 1 ? "resposta" : "respostas"}
          </p>
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white border border-border p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={c.author}
                    size={32}
                    src={c.authorAvatar?.startsWith("data:image/") ? c.authorAvatar : undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{c.author}</span>
                      <span className="text-[10px] text-foreground/50">{c.createdAt}</span>
                      {c.editedAt && (
                        <span className="text-[10px] text-foreground/40 italic">(editado)</span>
                      )}
                    </div>

                    {editingId === c.id ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditText("");
                            }
                          }}
                          className="flex-1 h-9 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                          autoFocus
                        />
                        <button
                          onClick={handleSend}
                          className="shrink-0 h-9 w-9 grid place-items-center rounded-lg bg-brand-gradient text-white"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="shrink-0 h-9 px-3 rounded-lg bg-muted text-foreground text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">{c.text}</p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() =>
                          setLikedComments((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                        }
                        className={`flex items-center gap-1 text-xs ${
                          likedComments[c.id] ? "text-[#000000]" : "text-foreground/50"
                        } hover:text-[#000000]`}
                      >
                        <Heart size={12} fill={likedComments[c.id] ? "#000000" : "none"} />{" "}
                        {c.likes + (likedComments[c.id] ? 1 : 0)}
                      </button>
                      <button
                        onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                        className="text-xs text-foreground/50 hover:text-[#000000] font-semibold"
                      >
                        Responder
                      </button>
                    </div>

                    {safeReplies(c.replies).length > 0 && (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-border space-y-2">
                        {safeReplies(c.replies).map((r, i) => {
                          const rKey = c.id + "-" + i;
                          const rLiked = likedReplies[rKey];
                          return (
                            <div key={rKey} className="text-sm">
                              <span className="font-semibold">{safeText(r.author, "Você")}</span>
                              <span className="text-foreground/80"> {safeText(r.text)}</span>
                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setLikedReplies((prev) => ({
                                      ...prev,
                                      [rKey]: !prev[rKey],
                                    }))
                                  }
                                  className={`flex items-center gap-0.5 text-[10px] ${
                                    rLiked ? "text-[#000000]" : "text-foreground/40"
                                  }`}
                                >
                                  <Heart size={10} fill={rLiked ? "#000000" : "none"} />{" "}
                                  {(Number.isFinite(r.likes) ? r.likes : 0) + (rLiked ? 1 : 0)}
                                </button>
                                <span className="text-[10px] text-foreground/40">
                                  {safeText(r.createdAt, "agora")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {replyingTo === c.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          className="flex-1 h-9 rounded-full bg-muted px-4 text-sm outline-none"
                          onKeyDown={(e) => e.key === "Enter" && handleReply(c.id)}
                        />
                        <button
                          onClick={() => handleReply(c.id)}
                          className="h-9 w-9 rounded-full bg-brand-gradient text-white grid place-items-center"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {c.author === CURRENT_USER && editingId !== c.id && (
                    <div className="relative shrink-0">
                      <CommentMenu
                        onEdit={() => {
                          setEditingId(c.id);
                          setEditText(c.text);
                        }}
                        onDelete={() => handleDelete(c.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-10 text-foreground/50 text-sm">
                Nenhum comentário ainda. Seja o primeiro a responder!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-white px-4 py-3">
        {editingId ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground/60 flex-1">Editando comentário...</p>
            <button
              onClick={() => { setEditingId(null); setEditText(""); }}
              className="h-11 px-4 rounded-2xl bg-muted text-foreground text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 h-11 rounded-2xl bg-muted px-4 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-11 w-11 rounded-2xl bg-brand-gradient text-white grid place-items-center shadow-pink disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden min-h-dvh bg-background">
        <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
          <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
            <div className="flex items-center justify-between px-3 h-14">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => nav({ to: "/conversas" })}
                  className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-sm truncate max-w-[200px]">Conversa</h1>
              </div>
              <div className="flex items-center gap-1">
                <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </header>
          {conversationDetail}
        </div>
      </div>

      {/* Desktop/tablet layout - dashboard */}
      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 h-dvh">
          <DesktopToolbar />
          <div className="flex-1 bg-white rounded-3xl border border-border shadow-soft flex flex-col min-h-0 overflow-hidden">
            {conversationDetail}
          </div>
        </div>
      </div>
    </>
  );
}

function isWithin24h(createdAt: string) {
  const v = String(createdAt || "").trim().toLowerCase();
  if (v === "agora") return true;
  if (/^\d+\s*(s|m|min|h|hora|horas|minutos?|segundos?)$/.test(v)) return true;
  return false;
}

function DesktopToolbar() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"recentes" | "todas">("recentes");
  const [, refreshList] = useReducer((value: number) => value + 1, 0);
  const all = getAllConversations();

  const query = q.trim().toLowerCase();
  const filtered = all.filter((c) => {
    if (!query) return true;
    const searchable = [
      safeText(c.title),
      safeText(c.description),
      safeText(c.author),
      ...(Array.isArray(c.tags) ? c.tags : []),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });

  const pinned = filtered.filter((c) => c.pinned);
  const list =
    tab === "recentes"
      ? filtered.filter((c) => !c.pinned && isWithin24h(c.createdAt))
      : filtered.filter((c) => !c.pinned && !isWithin24h(c.createdAt));

  const handleTogglePin = (id: string) => {
    togglePinConversation(id);
    refreshList();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conversa?")) return;
    deleteConversation(id);
    refreshList();
  };

  return (
    <div className="w-80 xl:w-96 shrink-0 space-y-4 overflow-y-auto scrollbar-brand">
      <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
        <p className="text-xs font-bold tracking-widest uppercase opacity-80">Fórum WEAZE</p>
        <h2 className="mt-1 text-2xl font-extrabold">Conversas da comunidade</h2>
        <p className="text-sm opacity-90">
          Participe das discussões, tire dúvidas e compartilhe conhecimento.
        </p>
      </div>

      <Link
        to="/conversas"
        className="w-full h-11 rounded-2xl bg-white text-[#000000] font-bold text-sm flex items-center justify-center gap-2 shadow-brand"
      >
        <Plus size={18} /> Criar conversa
      </Link>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-11">
        <Search size={18} className="text-foreground/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar conversas..."
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="flex gap-2">
        {(["recentes", "todas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 ${
              tab === t ? "bg-brand-gradient text-white" : "bg-muted text-foreground/70"
            }`}
          >
            <MessageSquare size={14} />
            {t === "recentes" ? "Recentes" : "Todas"}
          </button>
        ))}
      </div>

      <div className="space-y-2 pb-4">
        {pinned.map((c) => (
          <button
            key={c.id}
            onClick={() => nav({ to: "/conversas/$id", params: { id: c.id } })}
            className="w-full text-left rounded-xl bg-white border border-border p-3 shadow-soft hover:shadow-brand transition-shadow"
          >
            <div className="flex items-center gap-1">
              <Pin size={10} className="text-[#000000]" />
              <span className="text-xs font-bold text-[#000000]">Fixada</span>
            </div>
            <p className="mt-1 text-sm font-semibold line-clamp-1">{c.title}</p>
          </button>
        ))}
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => nav({ to: "/conversas/$id", params: { id: c.id } })}
            className="w-full text-left rounded-xl bg-white border border-border p-3 shadow-soft hover:shadow-brand transition-shadow"
          >
            <p className="text-sm font-semibold line-clamp-1">{c.title}</p>
            <p className="text-xs text-foreground/60 line-clamp-1">{c.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted text-foreground/50"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-soft border border-border overflow-hidden min-w-[130px]">
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Pencil size={13} /> Editar
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#000000] hover:bg-muted"
            >
              <Trash2 size={13} /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
