import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, MessageSquare, MessageSquareText, Play, Pencil, MoreVertical, Trash2 } from "lucide-react";
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
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export type Post = {
  id: string;
  tenant_id: string;
  author_id?: string | null;
  type: "video" | "image" | "text";
  media_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  discussion_enabled?: boolean;
  interaction_prompt?: string | null;
  is_live?: boolean;
  created_at: string;
  post_cta?: any[];
  profiles?: { name: string; avatar_url: string | null } | null;
  topics?: { id: string; title: string; replies_count: number; last_activity_at: string }[];
};

type MediaType = "video" | "image" | "youtube" | "instagram" | "vimeo";

function getMediaType(url: string | null): MediaType | null {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("youtube-nocookie.com")) {
    return "youtube";
  }
  if (lowerUrl.includes("instagram.com")) {
    return "instagram";
  }
  if (lowerUrl.includes("vimeo.com")) {
    return "vimeo";
  }
  if (lowerUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) || lowerUrl.includes("cloudinary") || lowerUrl.includes("video")) {
    return "video";
  }
  return null;
}

function getVideoEmbedUrl(url: string, type: MediaType): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (type === "youtube") {
      let videoId = urlObj.searchParams.get("v");
      if (!videoId && url.includes("youtu.be")) {
        videoId = url.split("/").pop()?.split("?")[0] ?? null;
      }
      if (!videoId && url.includes("/shorts/")) {
        videoId = url.split("/shorts/")[1]?.split("?")[0] ?? null;
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
      }
    }
    if (type === "instagram") {
      return url.replace("instagram.com", "instagram.com/oembed");
    }
    if (type === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
  } catch {}
  return null;
}

function isDirectVideoUrl(url: string | null): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.endsWith(".ogg") ||
    lowerUrl.endsWith(".mov") ||
    lowerUrl.includes("cloudinary") ||
    lowerUrl.includes("video.") ||
    lowerUrl.includes("stream")
  );
}

export default function FeedItem({ post, active, onDelete }: { post: Post; active: boolean; onDelete?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, appRole } = useAuth();
  const { tenant, isOwner, canManage } = useTenant();
  const nav = useNavigate();
  const [liked, setLiked] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  const [counts, setCounts] = useState({ likes: 0, comments: 0 });
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const tappedRef = useRef(0);
  const trackedView = useRef(false);

  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatComment, setChatComment] = useState("");
  const [sending, setSending] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; delay: number; size: number }[]>([]);
  const heartIdRef = useRef(0);
  const [topicReplies, setTopicReplies] = useState<any[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [showTopicPreview, setShowTopicPreview] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.description || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isPostAuthor = user && post.author_id === user.id;
  const canDeletePost = canManage || isPostAuthor;
  const canEditPost = canManage || isPostAuthor;
  
  // Debug: log dos IDs para auditoria
  console.log("[FeedItem Debug] post.author_id:", post.author_id, "user.id:", user?.id, "isPostAuthor:", isPostAuthor, "canManage:", canManage);
  
  const showSocialActions = appRole !== "b2b" && appRole !== "admin";

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
    // Fetch topics for this post
    if (post.discussion_enabled) {
      supabase.from("topics")
        .select("id, title, replies_count, last_activity_at")
        .eq("related_post_id", post.id)
        .order("last_activity_at", { ascending: false })
        .limit(2)
        .then(({ data }) => {
          if (data) {
            setTopicReplies(data);
            setTopicCount(data.reduce((acc, t) => acc + (t.replies_count || 0), 0));
          }
        });
    }
  }, [post.id, user, post.discussion_enabled]);

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
    if (videoRef.current) videoRef.current.muted = !muted);
  };

  const handleDeleteSuccess = () => {
    if (onDelete) onDelete();
  };

  const handleEditSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) { toast.error("Digite um conteúdo"); return; }
    setSavingEdit(true);
    const { error } = await supabase.from("posts").update({ description: trimmed }).eq("id", post.id);
    setSavingEdit(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Postagem atualizada");
    setShowEditDialog(false);
    if (onDelete) onDelete();
  };

  const handleDeleteConfirm = async () => {
    setSavingDelete(true);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    setSavingDelete(false);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Postagem removida");
    setShowDeleteDialog(false);
    if (onDelete) onDelete();
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
    if (liked && !forceLike) {
      setLiked(false);
      setCounts((c) => ({ ...c, likes: Math.max(0, c.likes - 1) }));
      return;
    }
    
    setPopHeart(true);
    setTimeout(() => setPopHeart(false), 600);
    
    const newHearts = Array.from({ length: 5 }, (_, i) => ({
      id: heartIdRef.current++,
      x: (Math.random() - 0.5) * 40,
      delay: i * 80 + Math.random() * 60,
      size: 0.8 + Math.random() * 0.4,
    }));
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 1000);
    
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

    try {
      const { data: existingTopic } = await supabase
        .from("topics")
        .select("id")
        .eq("related_post_id", post.id)
        .limit(1)
        .maybeSingle();

      if (existingTopic) {
        nav(`/conversas/${existingTopic.id}`);
        return;
      }

      const { data: newTopic, error: createError } = await supabase
        .from("topics")
        .insert({
          tenant_id: tenant.id,
          related_post_id: post.id,
          title: "Discussão sobre este post",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (createError) {
        toast.error("Erro ao criar discussão");
        return;
      }

      if (newTopic) {
        nav(`/conversas/${newTopic.id}`);
      }
    } catch (err) {
      toast.error("Erro ao abrir discussão");
    }
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
  const isLivePost = post.is_live || (postCta?.type === "live");
  const mediaType = getMediaType(post.media_url);
  const isExternalVideo = mediaType === "youtube" || mediaType === "instagram" || mediaType === "vimeo";
  const isDirectVideo = isDirectVideoUrl(post.media_url);
  const embedUrl = isExternalVideo && mediaType ? getVideoEmbedUrl(post.media_url!, mediaType) : null;

  return (
    <article className="relative h-[100dvh] w-full snap-start bg-foreground text-background overflow-hidden" onClick={onTap}>
      {post.type === "video" && post.media_url ? (
        isExternalVideo && embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        ) : isDirectVideo ? (
          <video ref={videoRef} src={post.media_url} className="feed-media absolute inset-0 h-full w-full object-cover"
            loop muted={muted} playsInline preload="metadata" poster={post.thumbnail_url ?? undefined}
            onTimeUpdate={onTimeUpdate} onClick={toggleMute} />
        ) : post.thumbnail_url ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                <Play className="h-8 w-8 text-foreground ml-1" />
              </div>
            </div>
          </div>
        ) : null
      ) : post.type === "image" && post.media_url ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <img src={post.media_url} alt={post.description ?? ""} className="w-full h-full object-cover" style={{ aspectRatio: "4/5" }} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-brand grid place-items-center px-8">
          <p className="font-display text-3xl text-balance text-center text-primary-foreground">{post.description}</p>
        </div>
      )}

      <div className="absolute inset-0 bg-overlay-top pointer-events-none" />
      <div className="absolute inset-0 bg-overlay pointer-events-none" />

      {/* Live Badge - appears for both is_live flag and live CTA type */}
      {isLivePost && (
        <div className="absolute top-20 left-4 z-20">
          <span className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold animate-pulse shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            AO VIVO
          </span>
        </div>
      )}

      {popHeart && (
        <Heart className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 fill-primary text-primary animate-scale-pop pointer-events-none drop-shadow-[0_0_24px_hsl(var(--brand-to)/0.6)]" />
      )}

      {/* right rail - posicionado ACIMA do CTA */}
      {/* B2B: mostra apenas Likes (número) e Comentários */}
      {/* B2C/Admin: mostra todas as ações sociais */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: "calc(9.5rem + 5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {showSocialActions && (
          <>
            <button onClick={toggleMute} className="flex flex-col items-center gap-1" aria-label={muted ? "Ativar som" : "Silenciar"}>
              {muted ? <VolumeX className="h-6 w-6 drop-shadow-md text-background" /> : <Volume2 className="h-6 w-6 drop-shadow-md text-background" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); like(); }} className="flex flex-col items-center gap-1 relative" aria-label="Curtir">
              <Heart className={cn("h-7 w-7 transition-all drop-shadow-md", liked ? "fill-primary-custom text-primary-custom" : "text-background")} />
              <span className="text-xs font-semibold drop-shadow-md">{counts.likes}</span>
              {hearts.length > 0 && (
                <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200 }}>
                  {hearts.map((heart) => (
                    <span
                      key={heart.id}
                      className="absolute"
                      style={{
                        fontSize: 16,
                        animation: `float-heart 1s ease-out ${heart.delay}ms forwards`,
                        transform: `translateX(${heart.x}px)`,
                      }}
                    >
                      ❤️
                    </span>
                  ))}
                </div>
              )}
            </button>
          </>
        )}
        {/* Likes count sempre visível para B2B */}
        {!showSocialActions && (
          <button onClick={(e) => { e.stopPropagation(); }} className="flex flex-col items-center gap-1" aria-label="Curtidas">
            <Heart className={cn("h-7 w-7 drop-shadow-md", liked ? "fill-primary-custom text-primary-custom" : "text-background")} />
            <span className="text-xs font-semibold drop-shadow-md">{counts.likes}</span>
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1" aria-label="Comentar">
          <MessageCircle className="h-7 w-7 drop-shadow-md text-background" />
          <span className="text-xs font-semibold drop-shadow-md">{counts.comments}</span>
        </button>
        {/* Discussion button - appears if discussion_enabled */}
        {post.discussion_enabled && (
          <button 
            onClick={(e) => { e.stopPropagation(); nav(`/conversas?post=${post.id}`); }} 
            className="flex flex-col items-center gap-1" 
            aria-label="Discutir"
          >
            <MessageSquareText className="h-7 w-7 drop-shadow-md text-background" />
            <span className="text-xs font-semibold drop-shadow-md">{topicCount > 0 ? `${topicCount} respostas` : 'Discutir'}</span>
          </button>
        )}
        {showSocialActions && (
          <>
            <button onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Compartilhar">
              <Share2 className="h-7 w-7 drop-shadow-md text-background" />
              <span className="text-xs font-semibold drop-shadow-md">Enviar</span>
            </button>
            <button onClick={startConversation} className="flex flex-col items-center gap-1" aria-label="Conversar">
              <MessageSquare className="h-7 w-7 drop-shadow-md text-background" />
              <span className="text-xs font-semibold drop-shadow-md">Conversar</span>
            </button>
          </>
        )}
        {(canEditPost || canDeletePost) && (
          <div className="flex flex-col items-center gap-1 relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="flex flex-col items-center gap-1"
              aria-label="Mais opções"
            >
              <MoreVertical className="h-7 w-7 drop-shadow-md text-background" />
            </button>
            {showMenu && (
              <div className="absolute right-0 bottom-full mb-2 bg-card rounded-xl shadow-lg border border-border py-1 z-50 min-w-[140px]">
                {canEditPost && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowEditDialog(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar postagem
                  </button>
                )}
                {canDeletePost && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteDialog(true); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir postagem
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar postagem</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Digite o conteúdo da postagem..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{editContent.length}/500</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={savingEdit || !editContent.trim()}>
              {savingEdit ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir postagem?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={savingDelete}>
              {savingDelete ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        {/* Interaction prompt - highlighted question to encourage interaction */}
        {post.interaction_prompt && (
          <p className="text-sm font-medium text-primary-custom bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg mb-3 drop-shadow-md">
            💬 {post.interaction_prompt}
          </p>
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
            <div className="aspect-[4/5] max-h-[50vh] mx-auto rounded-xl overflow-hidden bg-gray-100 shadow-inner">
              {post.type === "video" && post.media_url ? (
                isExternalVideo && embedUrl ? (
                  <iframe src={embedUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen frameBorder="0" />
                ) : isDirectVideo ? (
                  <video src={post.media_url} className="w-full h-full object-cover" muted loop playsInline autoPlay />
                ) : post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : null
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
              className="w-full h-12 bg-[#630091] text-white hover:bg-[#52007a] transition-colors rounded-xl font-medium disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Comentar no post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
