import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { track } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CTAButton from "./CTAButton";
import { cn } from "@/lib/utils";

export type Post = {
  id: string;
  tenant_id: string;
  type: "video" | "image" | "text";
  media_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  created_at: string;
  post_cta?: any[];
  profiles?: { name: string; avatar_url: string | null } | null;
};

export default function FeedItem({ post, active }: { post: Post; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [counts, setCounts] = useState({ likes: 0, comments: 0 });
  const tappedRef = useRef<number>(0);
  const trackedView = useRef(false);

  useEffect(() => {
    // counts
    (async () => {
      const [{ count: l }, { count: c }] = await Promise.all([
        supabase.from("interactions").select("*", { count: "exact", head: true }).eq("post_id", post.id).eq("action_type", "like"),
        supabase.from("interactions").select("*", { count: "exact", head: true }).eq("post_id", post.id).eq("action_type", "comment"),
      ]);
      setCounts({ likes: l ?? 0, comments: c ?? 0 });
    })();
    // liked?
    if (user) {
      supabase.from("interactions").select("id").eq("post_id", post.id).eq("action_type", "like").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setLiked(!!data));
    }
  }, [post.id, user]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
      if (!trackedView.current) {
        trackedView.current = true;
        track({ tenantId: post.tenant_id, postId: post.id, action: "view" });
      }
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, post.tenant_id, post.id]);

  const onTap = async () => {
    const now = Date.now();
    if (now - tappedRef.current < 300) {
      tappedRef.current = 0;
      await like(true);
    } else {
      tappedRef.current = now;
    }
  };

  const like = async (forceLike = false) => {
    setPopHeart(true);
    setTimeout(() => setPopHeart(false), 600);
    if (liked && !forceLike) return;
    setLiked(true);
    setCounts((c) => ({ ...c, likes: c.likes + 1 }));
    await track({ tenantId: post.tenant_id, postId: post.id, action: "like" });
  };

  const cta = post.post_cta?.[0];

  return (
    <article className="relative h-[100dvh] w-full snap-start bg-foreground text-background overflow-hidden" onClick={onTap}>
      {post.type === "video" && post.media_url ? (
        <video ref={videoRef} src={post.media_url} className="absolute inset-0 h-full w-full object-cover"
          loop muted playsInline preload="metadata" poster={post.thumbnail_url ?? undefined} />
      ) : post.type === "image" && post.media_url ? (
        <img src={post.media_url} alt={post.description ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-brand grid place-items-center px-8">
          <p className="font-display text-3xl text-balance text-center text-primary-foreground">{post.description}</p>
        </div>
      )}

      <div className="absolute inset-0 bg-overlay-top pointer-events-none" />
      <div className="absolute inset-0 bg-overlay pointer-events-none" />

      {popHeart && (
        <Heart className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 fill-primary text-primary animate-scale-pop pointer-events-none drop-shadow-[0_0_24px_hsl(var(--brand-to)/0.6)]" />
      )}

      {/* right rail */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        <button onClick={(e) => { e.stopPropagation(); like(); }} className="flex flex-col items-center gap-1">
          <Heart className={cn("h-7 w-7 transition-all drop-shadow-md", liked ? "fill-primary text-primary" : "text-background")} />
          <span className="text-xs font-semibold drop-shadow-md">{counts.likes}</span>
        </button>
        <div className="flex flex-col items-center gap-1 opacity-90">
          <MessageCircle className="h-7 w-7 drop-shadow-md" />
          <span className="text-xs font-semibold drop-shadow-md">{counts.comments}</span>
        </div>
      </div>

      {/* bottom info */}
      <div className="absolute left-0 right-0 bottom-20 px-5 z-10 max-w-md">
        {post.profiles?.name && (
          <p className="font-semibold text-sm mb-2 drop-shadow-md">@{post.profiles.name}</p>
        )}
        {post.description && (
          <p className="text-sm leading-relaxed mb-4 line-clamp-3 text-pretty">{post.description}</p>
        )}
        {cta && (
          <div onClick={(e) => e.stopPropagation()}>
            <CTAButton cta={cta} postId={post.id} tenantId={post.tenant_id} />
          </div>
        )}
      </div>
    </article>
  );
}
