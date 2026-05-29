import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useReducer } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { BottomNav } from "@/components/weaze/BottomNav";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { getAllPosts, updatePost, deletePost } from "@/lib/mock-data";
import { useWeaze } from "@/lib/weaze-context";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed — WEAZE" }] }),
  component: Feed,
});

function Feed() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const allPosts = getAllPosts();

  return (
    <div className="min-h-dvh bg-black">
      <div className="mx-auto max-w-md min-h-dvh relative bg-black">
        <header className="absolute top-0 inset-x-0 z-30 pt-3 px-4 safe-pt">
          <div className="flex items-center justify-between">
            <WeazeLogo size="sm" variant="white" />
            <FeedBell />
          </div>
        </header>

        <div className="h-dvh overflow-y-auto snap-y-mandatory scrollbar-hide">
          {allPosts.map((p) => (
            <PostCard key={p.id} post={p} onChange={forceUpdate} />
          ))}
          {allPosts.length === 0 && (
            <div className="h-dvh grid place-items-center text-white/50 text-sm">
              Nenhuma postagem ainda.
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
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
}: {
  post: ReturnType<typeof getAllPosts>[number];
  onChange: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const hasRealMedia = post.mediaUrl && (post.mediaType === "image" || post.mediaType === "video");
  const { addLike, addComment, addShare } = useWeaze();

  return (
    <article
      className={`snap-start-always relative h-dvh w-full ${!hasRealMedia ? `bg-gradient-to-br ${post.mediaColor}` : "bg-black"}`}
      onClick={() => setPlaying((p) => !p)}
    >
      {hasRealMedia ? (
        post.mediaType === "video" ? (
          <video
            src={post.mediaUrl}
            className="absolute inset-0 h-full w-full object-cover"
            loop
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
        <div className="absolute inset-0 grid place-items-center">
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
              addLike();
            }
          }}
        />
        <ActionBtn
          icon={MessageCircle}
          label={shortNum(post.comments)}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            addComment();
          }}
        />
        <ActionBtn
          icon={Share2}
          label={shortNum(post.shares)}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            addShare();
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
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm"
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
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm"
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
