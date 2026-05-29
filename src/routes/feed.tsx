import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play, Pause } from "lucide-react";
import { BottomNav } from "@/components/weaze/BottomNav";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { posts as mockPosts } from "@/lib/mock-data";
import { FeedSkeleton } from "@/components/weaze/Skeleton";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed — WEAZE" }] }),
  component: Feed,
});

function Feed() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-dvh bg-black">
      <div className="mx-auto max-w-md min-h-dvh relative bg-black">
        <header className="absolute top-0 inset-x-0 z-30 pt-3 px-4 safe-pt">
          <div className="flex items-center justify-between">
            <WeazeLogo size="sm" variant="white" />
            <div className="flex items-center gap-6 text-white text-sm font-semibold">
              {(["following", "foryou"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`pb-1 border-b-2 transition-colors ${
                    tab === k ? "border-white" : "border-transparent text-white/60"
                  }`}
                >
                  {k === "foryou" ? "Para você" : "Seguindo"}
                </button>
              ))}
            </div>
            <span className="w-7" />
          </div>
        </header>

        {loading ? (
          <div className="pt-20">
            <FeedSkeleton />
          </div>
        ) : (
          <div className="h-dvh overflow-y-auto snap-y-mandatory scrollbar-hide">
            {mockPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {mockPosts.map((p) => (
              <PostCard key={p.id + "b"} post={p} />
            ))}
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}

function PostCard({ post }: { post: (typeof mockPosts)[number] }) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);
  return (
    <article
      className={`snap-start-always relative h-dvh w-full bg-gradient-to-br ${post.mediaColor}`}
      onClick={() => setPlaying((p) => !p)}
    >
      <div className="absolute inset-0 grid place-items-center text-[180px] select-none opacity-90">
        {post.emoji}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {!playing && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-20 w-20 grid place-items-center rounded-full bg-white/20 backdrop-blur">
            <Play size={32} className="text-white" />
          </span>
        </div>
      )}

      <div className="absolute right-3 bottom-32 flex flex-col gap-5 items-center text-white">
        <Link
          to="/communities/$id"
          params={{ id: post.community.id }}
          className="flex flex-col items-center"
        >
          <span className="h-12 w-12 rounded-full bg-brand-gradient grid place-items-center text-white font-bold border-2 border-white">
            {post.community.name[0]}
          </span>
          <span className="-mt-2 h-5 w-5 rounded-full bg-[#d81e62] grid place-items-center text-xs font-bold border-2 border-white">
            +
          </span>
        </Link>
        <ActionBtn
          icon={Heart}
          label={shortNum(post.likes + (liked ? 1 : 0))}
          active={liked}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setLiked((v) => !v);
          }}
        />
        <ActionBtn icon={MessageCircle} label={shortNum(post.comments)} />
        <ActionBtn icon={Share2} label={shortNum(post.shares)} />
        <ActionBtn icon={Bookmark} label="Salvar" />
      </div>

      <div className="absolute left-0 right-20 bottom-24 px-4 text-white">
        <Link
          to="/communities/$id"
          params={{ id: post.community.id }}
          className="inline-flex items-center gap-2"
        >
          <span className="font-bold">{post.community.name}</span>
          {post.community.verified && (
            <span className="h-4 w-4 rounded-full bg-[#d81e62] grid place-items-center text-[10px]">
              ✓
            </span>
          )}
        </Link>
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
            className="mt-3 inline-flex items-center justify-center bg-brand-gradient text-white font-bold rounded-2xl px-5 h-11 text-sm shadow-brand"
          >
            {post.cta}
          </a>
        )}
      </div>
    </article>
  );
}

function ActionBtn({ icon: Icon, label, active, onClick }: any) {
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
