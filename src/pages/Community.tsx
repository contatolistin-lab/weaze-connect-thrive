import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  tenant_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string | null;
};

export default function Community() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const profileCache = useRef<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchProfileName = async (userId: string): Promise<string | null> => {
    if (profileCache.current.has(userId)) return profileCache.current.get(userId)!;
    const { data } = await supabase.from("profiles").select("name").eq("user_id", userId).maybeSingle();
    const name = data?.name ?? null;
    if (name) profileCache.current.set(userId, name);
    return name;
  };

  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("community_messages")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar mensagens");
        return;
      }

      const rows = (data ?? []) as Msg[];
      const uniqueUserIds = Array.from(new Set(rows.map(m => m.user_id)));
      if (uniqueUserIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id,name").in("user_id", uniqueUserIds);
        (profs ?? []).forEach(p => profileCache.current.set(p.user_id, p.name));
      }

      if (cancelled) return;
      setMessages(rows.map(m => ({ ...m, author_name: profileCache.current.get(m.user_id) ?? null })));
    };

    loadMessages();

    const channel = supabase
      .channel(`community-${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `tenant_id=eq.${tenant.id}` },
        async (payload) => {
          const row = payload.new as Msg;
          const name = await fetchProfileName(row.user_id);
          setMessages(prev => {
            if (prev.some(m => m.id === row.id)) return prev;
            return [...prev, { ...row, author_name: name }];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!tenant || !user || !text.trim()) return;

    const { error } = await supabase.from("community_messages").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      content: text.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setText("");
  };

  const isPostComment = (content: string) => content?.startsWith("[Post]");
  const extractImage = (content: string) => {
    const lines = content.split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("http") && /\.(jpg|jpeg|png|gif|webp|mp4)(\?|$)/i.test(t)) {
        return t;
      }
    }
    return null;
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full pb-24 space-y-3">
        <h1 className="font-display text-3xl mb-4">Comunidade</h1>
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm">Seja o primeiro a escrever.</p>
        )}
        {messages.map((m) => {
          const isPost = isPostComment(m.content);
          const imageUrl = isPost ? extractImage(m.content) : null;
          const isVideo = imageUrl ? /\.mp4(\?|$)/i.test(imageUrl) : false;
          const displayText = isPost
            ? m.content.replace(/\[Post\]\s*/, "").split("\n").filter(l => !l.trim().startsWith("http")).join("\n").trim()
            : m.content;
          return (
            <div key={m.id} className={`flex gap-2 ${m.user_id === user?.id ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-medium shrink-0">
                {m.author_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.user_id === user?.id ? "bg-foreground text-background" : "bg-secondary"}`}>
                <p className="text-xs opacity-70 mb-0.5">{m.author_name || "Anônimo"}</p>
                {imageUrl && (
                  isVideo ? (
                    <video src={imageUrl} className="w-full max-h-48 rounded-lg mb-2" muted loop playsInline controls />
                  ) : (
                    <img src={imageUrl} alt="Post" className="w-full max-h-48 object-cover rounded-lg mb-2" />
                  )
                )}
                {displayText && <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-xl mx-auto flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem..."
            onKeyDown={(e) => e.key === "Enter" && send()}
            maxLength={1000}
          />
          <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
