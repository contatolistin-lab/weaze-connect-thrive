import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

type Msg = { id: string; user_id: string; content: string; created_at: string; profiles?: { name: string } | null };

export default function Community() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data } = await supabase
        .from("community_messages")
        .select("*, profiles:user_id(name)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages((data ?? []) as any);
    })();
    const ch = supabase.channel(`community-${tenant.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `tenant_id=eq.${tenant.id}` },
        async (payload) => {
          const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", (payload.new as any).user_id).maybeSingle();
          setMessages((m) => [...m, { ...(payload.new as any), profiles: prof }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tenant?.id]);

  const send = async () => {
    if (!tenant || !user || text.trim().length === 0) return;
    const content = text.trim().slice(0, 1000);
    setText("");
    // Garante membership (auto-join no envio para usuários b2c)
    const { data: mem } = await supabase.from("memberships").select("id").eq("user_id", user.id).eq("tenant_id", tenant.id).maybeSingle();
    if (!mem) await supabase.from("memberships").insert({ user_id: user.id, tenant_id: tenant.id, role: "member" });
    const { error } = await supabase.from("community_messages").insert({ tenant_id: tenant.id, user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full pb-24 space-y-3">
        <h1 className="font-display text-3xl mb-4">Comunidade</h1>
        {messages.length === 0 && <p className="text-muted-foreground text-sm">Seja o primeiro a escrever.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.user_id === user?.id ? "flex-row-reverse" : ""}`}>
            <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-medium shrink-0">
              {m.profiles?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.user_id === user?.id ? "bg-foreground text-background" : "bg-secondary"}`}>
              <p className="text-xs opacity-70 mb-0.5">{m.profiles?.name ?? "Anônimo"}</p>
              <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-xl mx-auto flex gap-2">
          <Input placeholder="Mensagem para a comunidade…" value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }} maxLength={1000} />
          <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
