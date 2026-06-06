import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useReducer, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Play,
  Pause,
  Youtube,
  Bell,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Send,
  Check,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { BottomNav } from "@/components/weaze/BottomNav";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import {
  getAllPosts,
  updatePost,
  deletePost,
  getPostComments,
  addComment,
  updateComment,
  deleteComment,
  type MockPostComment,
} from "@/lib/mock-data";
import { useWeaze } from "@/lib/weaze-context";
import { useCommunity } from "@/lib/community-store";
import { z } from "zod";

const FeedSearchSchema = z.object({
  comunidade: z.string().optional(),
});

export const Route = createFileRoute("/feed")({
  validateSearch: FeedSearchSchema,
  head: () => ({ meta: [{ title: "Feed — WEAZE" }] }),
  component: Feed,
});

function Feed() {
  const { comunidade: searchComunidade } = Route.useSearch();
  const { userType, hydrated } = useCommunity();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const allPosts = getAllPosts();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  let b2cSlug: string | undefined;
  if (hydrated && !userType.isB2B && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("weaze_b2c_community");
      if (raw) b2cSlug = JSON.parse(raw).slug;
    } catch {}
  }

  const comunidade = searchComunidade || b2cSlug;
  const filteredPosts = comunidade
    ? allPosts.filter((p) => slugify(p.community.name) === comunidade)
    : allPosts;

  return (
    <div className="min-h-dvh bg-black">
      <div className="mx-auto max-w-md min-h-dvh relative bg-black">
        <header className="absolute top-0 inset-x-0 z-30 pt-3 px-4 safe-pt">
          <div className="flex items-center justify-between">
            {comunidade ? (
              <Link
                to="/"
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10 text-white"
              >
                <ArrowLeft size={20} />
              </Link>
            ) : (
              <WeazeLogo size="sm" />
            )}
            <FeedBell />
          </div>
        </header>

        <div className="h-dvh overflow-y-auto snap-y-mandatory scrollbar-hide scrollbar-feed-md">
          {filteredPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onChange={forceUpdate}
              onCommentClick={() => setCommentPostId(p.id)}
            />
          ))}
          {filteredPosts.length === 0 && (
            <div className="h-dvh grid place-items-center text-white/50 text-sm">
              Nenhuma postagem dessa comunidade ainda.
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      {commentPostId && (
        <CommentsModal
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
          onChange={forceUpdate}
        />
      )}
    </div>
  );
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function FeedBell() {
  const { unreadCount } = useWeaze();
  return (
    <Link
      to="/notifications"
      className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10 relative text-white"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-brand-gradient text-[10px] font-bold text-white grid place-items-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

function PostCard({
  post,
  onChange,
  onCommentClick,
}: {
  post: ReturnType<typeof getAllPosts>[number];
  onChange: () => void;
  onCommentClick: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [shared, setShared] = useState(false);
  const hasRealMedia = post.mediaUrl && (post.mediaType === "image" || post.mediaType === "video");
  const { addLike, addComment: addNotif, addShare } = useWeaze();

  return (
    <article
      className={`snap-start-always relative h-dvh w-full ${!hasRealMedia ? `bg-gradient-to-br ${post.mediaColor}` : "bg-black"}`}
    >
      {hasRealMedia ? (
        post.mediaType === "video" ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted
            playsInline
            onClick={(e) => {
              e.stopPropagation();
              setPlaying((p) => !p);
            }}
          />
        ) : (
          <img src={post.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[180px] select-none opacity-90">
          {post.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {!playing && hasRealMedia && (
        <div
          className="absolute inset-0 grid place-items-center z-10"
          onClick={(e) => {
            e.stopPropagation();
            setPlaying(true);
          }}
        >
          <span className="h-20 w-20 grid place-items-center rounded-full bg-white/20 backdrop-blur">
            <Play size={32} className="text-white" />
          </span>
        </div>
      )}

      {post.mediaType === "external" && post.mediaUrl && (
        <div className="absolute inset-0 grid place-items-center">
          {post.mediaPreview ? (
            <img
              src={post.mediaPreview}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${post.mediaColor} grid place-items-center`}
            />
          )}
          <a
            href={post.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 h-16 w-16 rounded-full bg-white/20 backdrop-blur grid place-items-center hover:bg-white/30 transition-colors"
          >
            <Youtube size={32} className="text-white ml-0.5" />
          </a>
        </div>
      )}

      <div className="absolute right-3 bottom-32 flex flex-col gap-5 items-center text-white">
        <ActionBtn
          icon={Heart}
          label={shortNum(post.likes + (liked ? 1 : 0))}
          active={liked}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (!liked) {
              setLiked(true);
              addLike("Você");
            }
          }}
        />
        <ActionBtn
          icon={MessageCircle}
          label={shortNum(post.comments)}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (post.commentsEnabled !== false) {
              onCommentClick();
              addNotif("Você");
            }
          }}
        />
        <ActionBtn
          icon={Share2}
          label={shared ? "Copiado!" : shortNum(post.shares)}
          onClick={async (e: React.MouseEvent) => {
            e.stopPropagation();
            addShare();
            const url = `${window.location.origin}/feed`;
            const title = post.community.name;
            const text = post.caption;
            if (navigator.share) {
              try {
                await navigator.share({ title, text, url });
              } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              setShared(true);
              setTimeout(() => setShared(false), 2000);
            }
          }}
        />
      </div>

      <div className="absolute left-0 right-20 bottom-24 px-4 text-white">
        <span className="inline-flex items-center gap-2">
          <span className="font-bold">{post.community.name}</span>
          {post.community.verified && (
            <span className="h-4 w-4 rounded-full bg-[#d81e62] grid place-items-center text-[10px]">
              ✓
            </span>
          )}
        </span>
        <p className="mt-2 text-sm leading-snug">{post.caption}</p>
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Music2 size={12} /> som original · {post.community.handle}
        </div>
        {post.cta && post.ctaLink && (
          <a
            href={post.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-center bg-brand-gradient text-white font-bold rounded-2xl px-6 h-12 text-sm shadow-brand w-full max-w-[220px]"
          >
            {post.cta}
          </a>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="absolute top-14 right-3 z-20 h-9 w-9 grid place-items-center rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/30"
      >
        <MoreVertical size={18} />
      </button>

      {menuOpen && (
        <>
          <div
            className="absolute inset-0 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <div
            className="absolute top-20 right-3 z-30 bg-white rounded-2xl shadow-soft border border-border overflow-hidden min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Pencil size={16} /> Editar
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setDeleteConfirm(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#d81e62] hover:bg-muted transition-colors"
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </>
      )}

      {editOpen && (
        <EditModal
          post={post}
          onClose={() => setEditOpen(false)}
          onSave={() => {
            setEditOpen(false);
            onChange();
          }}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirm
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={() => {
            deletePost(post.id);
            setDeleteConfirm(false);
            onChange();
          }}
        />
      )}
    </article>
  );
}

function EditModal({
  post,
  onClose,
  onSave,
}: {
  post: ReturnType<typeof getAllPosts>[number];
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(post.community.name);
  const [caption, setCaption] = useState(post.caption);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Editar postagem</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
              Título
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
              Descrição
            </p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none"
            />
          </div>
          <button
            onClick={() => {
              updatePost(post.id, { title, caption });
              onSave();
            }}
            className="w-full h-11 rounded-2xl bg-brand-gradient text-white font-bold text-sm shadow-brand"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg text-center">Excluir postagem</h2>
        <p className="mt-2 text-sm text-foreground/60 text-center">
          Tem certeza? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-2xl bg-muted text-foreground font-semibold text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-2xl bg-[#d81e62] text-white font-bold text-sm"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentsModal({
  postId,
  onClose,
  onChange,
}: {
  postId: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const { userType } = useCommunity();
  const [comments, setComments] = useState(() => getPostComments(postId));
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const refresh = () => {
    setComments([...getPostComments(postId)]);
    onChange();
  };

  const handleSend = () => {
    const text = (editingId ? editText : input).trim();
    if (!text) return;
    if (editingId) {
      updateComment(editingId, text);
      setEditingId(null);
      setEditText("");
    } else {
      addComment(postId, text);
      setInput("");
    }
    refresh();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md mx-auto bg-white rounded-t-3xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border shrink-0">
          <h2 className="font-bold text-lg">Comentários</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 scrollbar-brand">
          {comments.length === 0 && (
            <p className="text-sm text-foreground/50 text-center py-8">Nenhum comentário ainda.</p>
          )}
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              isEditing={editingId === c.id}
              editText={editText}
              onEdit={() => {
                setEditingId(c.id);
                setEditText(c.text);
              }}
              onEditChange={setEditText}
              onSaveEdit={() => {
                const t = editText.trim();
                if (!t) return;
                updateComment(c.id, t);
                setEditingId(null);
                setEditText("");
                refresh();
              }}
              onCancelEdit={() => {
                setEditingId(null);
                setEditText("");
              }}
              onDelete={() => {
                deleteComment(c.id, postId);
                refresh();
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t border-border shrink-0">
          <span className="shrink-0 h-8 w-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold">
            V
          </span>
          {editingId ? (
            <div className="flex-1 flex items-center gap-2">
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
                className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
                autoFocus
              />
              <button
                onClick={handleSend}
                className="shrink-0 h-10 w-10 grid place-items-center rounded-xl bg-brand-gradient text-white"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditText("");
                }}
                className="shrink-0 h-10 px-3 rounded-xl bg-muted text-foreground text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Escreva um comentário..."
                className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="shrink-0 h-10 w-10 grid place-items-center rounded-xl bg-brand-gradient text-white disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  isEditing,
  editText,
  onEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: MockPostComment;
  isEditing: boolean;
  editText: string;
  onEdit: () => void;
  onEditChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex gap-3">
      <span className="shrink-0 h-8 w-8 rounded-full bg-brand-gradient grid place-items-center text-white text-xs font-bold">
        {comment.authorAvatar}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{comment.author}</span>
          <span className="text-[10px] text-foreground/50">{comment.createdAt}</span>
          {comment.editedAt && (
            <span className="text-[10px] text-foreground/40 italic">(editado)</span>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              className="flex-1 h-8 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
              autoFocus
            />
            <button
              onClick={onSaveEdit}
              className="shrink-0 h-8 w-8 grid place-items-center rounded-lg bg-brand-gradient text-white"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground/80">{comment.text}</p>
        )}
      </div>
      {!isEditing && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted text-foreground/50"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-soft border border-border overflow-hidden min-w-[130px]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <Pencil size={13} /> Editar
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
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
      )}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span
        className={`h-12 w-12 grid place-items-center rounded-full bg-white/15 backdrop-blur ${active ? "text-[#d81e62] bg-white" : "text-white"}`}
      >
        <Icon size={24} fill={active ? "#d81e62" : "none"} />
      </span>
      <span className="text-[11px] font-semibold text-white">{label}</span>
    </button>
  );
}

function shortNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}
