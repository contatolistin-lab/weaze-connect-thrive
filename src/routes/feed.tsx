import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Play,
  Pause,
  Youtube,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { BottomNav } from "@/components/weaze/BottomNav";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { getAllPosts } from "@/lib/mock-data";
import { useWeaze } from "@/lib/weaze-context";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed — WEAZE" }] }),
  component: Feed,
});

function Feed() {
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
            <PostCard key={p.id} post={p} />
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

function PostCard({ post }: { post: ReturnType<typeof getAllPosts>[number] }) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);
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
    </article>
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
