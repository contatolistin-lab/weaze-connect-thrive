import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type Msg = { id: string; sender_id: string; content: string; created_at: string };

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [threads, setThreads] = useState<any[]>([]);

  // Owner: lista todas as threads do tenant
  // Usuário comum: usa/ cria sua própria thread
  useEffect(() => {
    if (!tenant || !user) return;
    (async () => {
      if (isOwner) {
        const { data } = await supabase.from("message_threads")
          .select("*, profiles:user_id(name)")
          .eq("tenant_id", tenant.id)
          .order("last_message_at", { ascending: false });
        setThreads(data ?? []);
      } else {
        let { data: t } = await supabase.from("message_threads").select("id")
          .eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
        if (!t) {
          const ins = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
          t = ins.data;
        }
        setThreadId(t?.id ?? null);
      }
    })();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at");
      setMessages((data ?? []) as Msg[]);
    })();
    const ch = supabase.channel(`thread-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (p) => setMessages((m) => [...m, p.new as Msg])).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  const send = async () => {
    if (!threadId || !user || !text.trim()) return;
    const content = text.trim().slice(0, 2000);
    setText("");
    await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, content });
    await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 overflow-y-auto max-w-xl mx-auto w-full px-4 py-4 pb-32">
        <h1 className="font-display text-3xl mb-4">Mensagens</h1>
        {isOwner && !threadId && (
          <div className="space-y-2">
            {threads.length === 0 && <p className="text-muted-foreground text-sm">Sem conversas ainda.</p>}
            {threads.map((t: any) => (
              <button key={t.id} onClick={() => setThreadId(t.id)} className="w-full text-left bg-card hover:bg-secondary p-3 rounded-xl shadow-soft">
                <p className="font-medium">{t.profiles?.name ?? "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.last_message_at).toLocaleString("pt-BR")}</p>
              </button>
            ))}
          </div>
        )}
        {threadId && (
          <div className="space-y-3">
            {isOwner && <Button variant="ghost" size="sm" onClick={() => setThreadId(null)}>← Conversas</Button>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : ""}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_id === user?.id ? "bg-foreground text-background" : "bg-secondary"}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {threadId && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-xl mx-auto flex gap-2">
            <Input placeholder="Escreva uma mensagem…" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }} maxLength={2000} />
            <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
