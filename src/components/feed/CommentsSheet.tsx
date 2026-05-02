import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { track } from "@/lib/tracking";
import { Send, Trash2 } from "lucide-react";

type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

export default function CommentsSheet({
  open, onOpenChange, postId, tenantId, onCountChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
  tenantId: string;
  onCountChange?: (delta: number) => void;
}) {
  const { user } = useAuth();
  const { isOwner } = useTenant();
  const [list, setList] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const profileCache = useRef<Map<string, { name: string; avatar: string }>>(new Map());

  const fetchProfile = async (userId: string): Promise<{ name: string; avatar: string } | null> => {
    if (profileCache.current.has(userId)) return profileCache.current.get(userId)!;
    const { data } = await supabase.from("profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle();
    const profile = { name: data?.name ?? null, avatar: data?.avatar_url ?? null };
    if (profile.name) profileCache.current.set(userId, profile);
    return profile;
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("interactions")
      .select("id, metadata, created_at, user_id, post_id")
      .eq("post_id", postId)
      .eq("action_type", "comment")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(async ({ data }) => {
        const items = (data ?? []).map((d: any) => ({
          id: d.id,
          post_id: d.post_id,
          content: d.metadata?.content ?? "",
          created_at: d.created_at,
          user_id: d.user_id,
        })).filter((c: Comment) => c.content);
        
        const uniqueUserIds = Array.from(new Set(items.map((c: Comment) => c.user_id)));
        if (uniqueUserIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", uniqueUserIds);
          (profs ?? []).forEach((p: any) => profileCache.current.set(p.user_id, { name: p.name, avatar: p.avatar_url }));
        }

        const itemsWithProfiles = items.map((c: Comment) => {
          const p = profileCache.current.get(c.user_id);
          return { ...c, author_name: p?.name ?? null, author_avatar: p?.avatar ?? null };
        });
        
        setList(itemsWithProfiles);
        setLoading(false);
      });
  }, [open, postId]);

  const remove = async (commentId: string, commentUserId: string) => {
    if (!user) return;
    if (commentUserId !== user.id && !isOwner) {
      toast.error("Você não pode excluir este comentário");
      return;
    }
    if (!confirm("Excluir comentário?")) return;
    
    const { error } = await supabase.from("interactions").delete().eq("id", commentId);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    setList((l) => l.filter((c) => c.id !== commentId));
    onCountChange?.(-1);
    toast.success("Comentário excluído");
  };

  const send = async () => {
    if (!text.trim()) return;
    if (!user) {
      toast.error("Entre para comentar");
      return;
    }
    setSending(true);
    const content = text.trim().slice(0, 500);
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        tenant_id: tenantId,
        post_id: postId,
        user_id: user.id,
        action_type: "comment",
        metadata: { content },
      })
      .select("id, created_at")
      .single();
    setSending(false);
    if (error) {
      toast.error("Não foi possível comentar");
      return;
    }
    const profile = await fetchProfile(user.id);
    setList((l) => [{ 
      id: data.id, 
      post_id: postId,
      content, 
      created_at: data.created_at, 
      user_id: user.id,
      author_name: profile?.name ?? null,
      author_avatar: profile?.avatar ?? null,
    }, ...l]);
    setText("");
    onCountChange?.(1);
    track({ tenantId, postId, action: "comment", metadata: { length: content.length } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold">Comentários</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50">
          {loading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}
          {!loading && list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Seja o primeiro a comentar.</p>
          )}
          {list.map((c) => {
            const canDelete = user && (c.user_id === user.id || isOwner);
            const authorInitial = c.author_name?.[0]?.toUpperCase() || "?";
            return (
              <div key={c.id} className="flex gap-2 items-start">
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt={c.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 grid place-items-center text-xs font-medium">
                      {authorInitial}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{c.author_name || "Anónimo"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <p className="text-sm leading-snug break-words">{c.content}</p>
                </div>
                {canDelete && (
                  <button onClick={() => remove(c.id, c.user_id)} className="shrink-0 p-1 text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-3 items-center">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={user ? "O que você acha? Responda aqui…" : "Entre para comentar"}
              disabled={!user || sending}
              maxLength={500}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              className="flex-1 h-11 bg-gray-50 border-0 rounded-xl px-4 focus:ring-2 focus:ring-brand/30"
            />
            <Button 
              onClick={send} 
              disabled={!user || sending || !text.trim()} 
              size="icon"
              className="h-11 w-11 shrink-0 bg-gradient-to-r from-[#630091] to-[#d81e62] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}