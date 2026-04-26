import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { track } from "@/lib/tracking";
import { Send } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  metadata: any;
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
  const [list, setList] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("interactions")
      .select("id, metadata, created_at, user_id")
      .eq("post_id", postId)
      .eq("action_type", "comment")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const items = (data ?? []).map((d: any) => ({
          id: d.id,
          content: d.metadata?.content ?? "",
          created_at: d.created_at,
          user_id: d.user_id,
          metadata: d.metadata,
        })).filter((c) => c.content);
        setList(items);
        setLoading(false);
      });
  }, [open, postId]);

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
    setList((l) => [{ id: data.id, content, created_at: data.created_at, user_id: user.id, metadata: { content } }, ...l]);
    setText("");
    onCountChange?.(1);
    track({ tenantId, postId, action: "comment", metadata: { length: content.length } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle>Comentários</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-3 space-y-3">
          {loading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}
          {!loading && list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Seja o primeiro a comentar.</p>
          )}
          {list.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-soft shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug break-words">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Adicione um comentário…" : "Entre para comentar"}
            disabled={!user || sending}
            maxLength={500}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <Button onClick={send} disabled={!user || sending || !text.trim()} size="icon" className="bg-brand text-primary-foreground shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
