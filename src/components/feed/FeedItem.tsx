import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Trash2 } from "lucide-react";
import { track } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CTAButton from "./CTAButton";
import CommentsSheet from "./CommentsSheet";
import { cn } from "@/lib/utils";

export type Post = {
  id: string;
  tenant_id: string;
  author_id?: string | null;
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
  const { tenant, isOwner } = useTenant();
  const [liked, setLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [counts, setCounts] = useState({ likes: 0, comments: 0 });
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const tappedRef = useRef<number>(0);
  const trackedView = useRef(false);

  const isPostOwner = isOwner && post.author_id === user?.id;

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
      v.muted = muted;
      v.play().catch(() => {});
      if (!trackedView.current) {
        trackedView.current = true;
        track({ tenantId: post.tenant_id, postId: post.id, action: "view" });
      }
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, muted, post.tenant_id, post.id]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(m => !m);
    if (videoRef.current) videoRef.current.muted = !muted;
  };

  const deletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta postagem?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Postagem excluída");
  };

  // Video progress
  const [progress, setProgress] = useState(0);
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100);
  };

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

  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/feed?post=${post.id}`;
    const title = post.profiles?.name ? `@${post.profiles.name} no Wenity` : "Wenity";
    const shareData: ShareData = { title, text: post.description ?? "", url };
    try {
      if (navigator.share && navigator.canShare?.(shareData) !== false) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      }
      track({ tenantId: post.tenant_id, postId: post.id, action: "click_cta", metadata: { kind: "share" } });
    } catch {
      /* user cancelled */
    }
  };

  const postCta = post.post_cta?.[0] ?? null;
  console.log("CTA RECEBIDO:", postCta);

  return (
    <article className="relative h-[100dvh] w-full snap-start bg-foreground text-background overflow-hidden" onClick={onTap}>
      {post.type === "video" && post.media_url ? (
        <video ref={videoRef} src={post.media_url} className="feed-media absolute inset-0 h-full w-full object-cover"
          loop muted={muted} playsInline preload="metadata" poster={post.thumbnail_url ?? undefined}
          onTimeUpdate={onTimeUpdate} onClick={toggleMute} />
      ) : post.type === "image" && post.media_url ? (
        <img src={post.media_url} alt={post.description ?? ""} className="feed-media absolute inset-0 h-full w-full object-cover" />
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

      {/* right rail - posicionado ACIMA do CTA */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: "calc(9.5rem + 3.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button onClick={toggleMute} className="flex flex-col items-center gap-1" aria-label={muted ? "Ativar som" : "Silenciar"}>
          {muted ? <VolumeX className="h-6 w-6 drop-shadow-md text-background" /> : <Volume2 className="h-6 w-6 drop-shadow-md text-background" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); like(); }} className="flex flex-col items-center gap-1" aria-label="Curtir">
          <Heart className={cn("h-7 w-7 transition-all drop-shadow-md", liked ? "fill-primary-custom text-primary-custom" : "text-background")} />
          <span className="text-xs font-semibold drop-shadow-md">{counts.likes}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1" aria-label="Comentar">
          <MessageCircle className="h-7 w-7 drop-shadow-md text-background" />
          <span className="text-xs font-semibold drop-shadow-md">{counts.comments}</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Compartilhar">
          <Share2 className="h-7 w-7 drop-shadow-md text-background" />
          <span className="text-xs font-semibold drop-shadow-md">Enviar</span>
        </button>
        {isPostOwner && (
          <button onClick={deletePost} className="flex flex-col items-center gap-1" aria-label="Excluir">
            <Trash2 className="h-7 w-7 drop-shadow-md text-background" />
            <span className="text-xs font-semibold drop-shadow-md">Excluir</span>
          </button>
        )}
      </div>

      {/* bottom info */}
      {postCta !== null && (
        <CTAButton cta={postCta} postId={post.id} tenantId={post.tenant_id} className="feed-cta-container" />
      )}

      <div
        className="absolute left-0 right-0 px-5 z-10 max-w-md"
        style={{ bottom: "calc(9.5rem + 3.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {post.profiles?.name && (
          <p className="font-semibold text-sm mb-2 drop-shadow-md">@{post.profiles.name}</p>
        )}
        {post.description && (
          <p className="text-sm leading-relaxed mb-4 line-clamp-3 text-pretty">{post.description}</p>
        )}
      </div>

      {/* progress bar for video - below CTA, non-interactive */}
      {post.type === "video" && (
        <div
          className="absolute left-0 right-0 h-1 bg-white/20 overflow-hidden pointer-events-none"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 2px)", zIndex: 5 }}
        >
          <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        tenantId={post.tenant_id}
        onCountChange={(d) => setCounts((c) => ({ ...c, comments: c.comments + d }))}
      />
    </article>
  );
}
