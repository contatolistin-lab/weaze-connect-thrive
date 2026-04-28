import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Trash2, MessageSquare } from "lucide-react";
import { track } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CTAButton from "./CTAButton";
import CommentsSheet from "./CommentsSheet";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  const nav = useNavigate();
  const [liked, setLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [counts, setCounts] = useState({ likes: 0, comments: 0 });
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const tappedRef = useRef<number>(0);
  const trackedView = useRef(false);

  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatComment, setChatComment] = useState("");
  const [sending, setSending] = useState(false);

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

  const startConversation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !tenant) { nav("/auth"); return; }
    setShowChatDialog(true);
  };

  const sendChatComment = async () => {
    if (!user || !tenant) { toast.error("Usuário não autenticado"); return; }
    const trimmed = chatComment.trim();
    if (!trimmed) { toast.error("Escreva um comentário"); return; }

    const thumbnailUrl = post.thumbnail_url || post.media_url || null;

    setSending(true);
    try {
      // Garante membership (idempotente)
      const { data: existingMem } = await supabase
        .from("memberships")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existingMem) {
        const { error: memErr } = await supabase.from("memberships").insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: "member",
        });
        if (memErr) {
          toast.error(`Erro ao entrar na comunidade: ${memErr.message}`);
          return;
        }
      }

      // Payload: marcador [Post], texto puro do usuário, e mídia em linha técnica [media]<url>
      // Os marcadores são consumidos pelo renderer e nunca exibidos.
      const parts = ["[Post]", trimmed];
      if (thumbnailUrl) parts.push(`[media]${thumbnailUrl}`);
      const messageContent = parts.join("\n");

      const { error } = await supabase.from("community_messages").insert({
        tenant_id: tenant.id,
        user_id: user.id,
        content: messageContent,
      });

      if (error) {
        toast.error(`Erro ao enviar: ${error.message}`);
        return;
      }

      toast.success("Comentário enviado para a comunidade!");
      setShowChatDialog(false);
      setChatComment("");
      nav("/community");
    } catch (err) {
      console.error("sendChatComment error", err);
      toast.error("Erro ao enviar");
    } finally {
      setSending(false);
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
        style={{ bottom: "calc(9.5rem + 5.5rem + env(safe-area-inset-bottom, 0px))" }}
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
        <button onClick={startConversation} className="flex flex-col items-center gap-1" aria-label="Falar com a marca">
          <MessageSquare className="h-7 w-7 drop-shadow-md text-background" />
          <span className="text-xs font-semibold drop-shadow-md">Falar</span>
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
        style={{ bottom: "calc(9.5rem + 5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {post.profiles?.name && (
          <p className="font-semibold text-sm mb-2 drop-shadow-md">@{post.profiles.name}</p>
        )}
        {post.description && (
          <p className="text-sm leading-relaxed mb-4 line-clamp-3 text-pretty">{post.description}</p>
        )}
      </div>

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        tenantId={post.tenant_id}
        onCountChange={(d) => setCounts((c) => ({ ...c, comments: c.comments + d }))}
      />

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold">Falar com a comunidade</DialogTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">Seu comentário será visível na comunidade.</p>
          </DialogHeader>
          <div className="space-y-4 px-5 py-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-inner">
              {post.type === "video" && post.media_url ? (
                <video src={post.media_url} className="w-full h-full object-cover" muted loop playsInline autoPlay />
              ) : post.type === "image" && post.media_url ? (
                <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
              ) : post.type === "text" ? (
                <div className="w-full h-full bg-brand flex items-center justify-center p-4">
                  <p className="text-primary-foreground text-center text-sm">{post.description?.slice(0, 100)}</p>
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Seu comentário</label>
              <Textarea
                value={chatComment}
                onChange={(e) => setChatComment(e.target.value)}
                placeholder="Escreva o que você achou do post..."
                maxLength={500}
                rows={4}
                className="bg-gray-50 border-0 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-brand/30"
              />
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{chatComment.length}/500</p>
            </div>
          </div>
          <DialogFooter className="px-5 pb-5 pt-2">
            <Button 
              onClick={sendChatComment} 
              disabled={sending || !chatComment.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#630091] to-[#d81e62] text-white hover:opacity-90 transition-opacity rounded-xl font-medium disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Comentar no post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
