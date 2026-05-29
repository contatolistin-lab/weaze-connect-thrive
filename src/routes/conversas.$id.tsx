import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
} from "@/lib/mock-data";

export const Route = createFileRoute("/conversas/$id")({
  component: ConversationDetail,
});

const CURRENT_USER = "Você";

function ConversationDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
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
            className="mt-3 text-sm text-[#d81e62] font-semibold"
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
    const c = comments.find((cm) => cm.id === commentId);
    if (c) {
      c.replies.push({ author: CURRENT_USER, text, createdAt: "agora", likes: 0 });
    }
    setReplyContent("");
    setReplyingTo(null);
    refresh();
  };

  const handleDelete = (commentId: string) => {
    deleteConversationComment(commentId, id);
    refresh();
  };

  return (
    <div className="min-h-dvh bg-background">
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

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-[#630091] font-semibold uppercase">
              {conv.pinned && <Pin size={12} />}
              {conv.category}
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight leading-snug">
              {conv.title}
            </h1>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{conv.description}</p>

            <div className="mt-3 flex items-center gap-3 text-xs text-foreground/60">
              <span className="h-6 w-6 rounded-full bg-brand-gradient text-white grid place-items-center text-[10px] font-bold">
                {conv.authorAvatar}
              </span>
              <span className="font-semibold text-foreground/80">{conv.author}</span>
              <span>·</span>
              <span>{conv.createdAt}</span>
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
              {conv.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient-soft text-[#630091] font-semibold"
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
                    ? "bg-[#d81e62] text-white border-[#d81e62]"
                    : "bg-white border-border text-foreground/70"
                }`}
              >
                <Heart size={16} fill={liked ? "white" : "none"} /> {conv.likes}
              </button>
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-white border-border border text-foreground/70">
                <MessageSquare size={16} /> Responder
              </button>
            </div>
          </div>

          <div className="px-4 pt-4 pb-20">
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
                    <span className="shrink-0 h-8 w-8 rounded-full bg-brand-gradient text-white grid place-items-center text-xs font-bold">
                      {c.authorAvatar}
                    </span>
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
                            className="flex-1 h-9 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
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
                            likedComments[c.id] ? "text-[#d81e62]" : "text-foreground/50"
                          } hover:text-[#d81e62]`}
                        >
                          <Heart size={12} fill={likedComments[c.id] ? "#d81e62" : "none"} />{" "}
                          {c.likes + (likedComments[c.id] ? 1 : 0)}
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                          className="text-xs text-foreground/50 hover:text-[#630091] font-semibold"
                        >
                          Responder
                        </button>
                      </div>

                      {c.replies.length > 0 && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-border space-y-2">
                          {c.replies.map((r, i) => {
                            const rKey = c.id + "-" + i;
                            const rLiked = likedReplies[rKey];
                            return (
                              <div key={i} className="text-sm">
                                <span className="font-semibold">{r.author}</span>
                                <span className="text-foreground/80"> {r.text}</span>
                                <div className="mt-1 flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      setLikedReplies((prev) => ({
                                        ...prev,
                                        [rKey]: !prev[rKey],
                                      }))
                                    }
                                    className={`flex items-center gap-0.5 text-[10px] ${
                                      rLiked ? "text-[#d81e62]" : "text-foreground/40"
                                    }`}
                                  >
                                    <Heart size={10} fill={rLiked ? "#d81e62" : "none"} />{" "}
                                    {r.likes + (rLiked ? 1 : 0)}
                                  </button>
                                  <span className="text-[10px] text-foreground/40">
                                    {r.createdAt}
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

        <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-pb">
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
        </div>
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
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#d81e62] hover:bg-muted"
            >
              <Trash2 size={13} /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
