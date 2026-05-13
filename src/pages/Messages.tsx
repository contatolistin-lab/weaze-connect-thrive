import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft } from "lucide-react";

const MessageInput = memo(function MessageInput({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  }, [text, disabled, onSend]);

  return (
    <div style={{ padding: "12px", background: "white", borderTop: "1px solid #e5e5e5", display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder="Digite uma mensagem..."
        disabled={disabled}
        style={{ 
          flex: 1, 
          padding: "10px 16px", 
          borderRadius: "24px", 
          border: "1px solid #ddd", 
          fontSize: "14px", 
          outline: "none" 
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        style={{ 
          padding: "10px 20px", 
          borderRadius: "24px", 
          background: text.trim() && !disabled ? "#25D366" : "#ccc", 
          color: "white", 
          border: "none", 
          fontWeight: 500,
          cursor: text.trim() && !disabled ? "pointer" : "default"
        }}
      >
        Enviar
      </button>
    </div>
  );
});

const MessageBubble = memo(function MessageBubble({ content, time, isMine }: { content: string; time: string; isMine: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: "8px" }}>
      <div style={{ 
        maxWidth: "70%", 
        padding: "10px 14px", 
        borderRadius: "16px", 
        background: isMine ? "#25D366" : "white", 
        color: isMine ? "white" : "black" 
      }}>
        <p style={{ fontSize: "14px", wordBreak: "break-word" }}>{content}</p>
        <p style={{ fontSize: "10px", marginTop: "4px", color: isMine ? "rgba(255,255,255,0.7)" : "#999" }}>{time}</p>
      </div>
    </div>
  );
});

function ChatWindow({ threadId, messages, onBack }: { threadId: string; messages: any[]; onBack: () => void }) {
  const { user } = useAuth();
  const { tenant, isOwner } = useTenant();
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatName = useMemo(() => {
    return isOwner ? "Usuário" : (tenant?.name || "Marca");
  }, [isOwner, tenant]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    const tempId = crypto.randomUUID();
    const optimisticMsg = {
      id: tempId,
      content,
      sender_id: user!.id,
      created_at: new Date().toISOString(),
      pending: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user!.id,
        content
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [threadId, user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid #e5e5e5", background: "white" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={20} color="#666" />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#666", fontWeight: 500 }}>{chatName[0]}</span>
        </div>
        <span style={{ fontWeight: 500 }}>{chatName}</span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f5f5f5" }}>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            content={m.content}
            time={new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            isMine={m.sender_id === user?.id}
          />
        ))}
      </div>

      <MessageInput onSend={handleSend} disabled={false} />
    </div>
  );
}

function ChatList({ threads, onSelect }: { threads: any[]; onSelect: (id: string) => void }) {
  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <h2 style={{ padding: "16px", fontSize: "20px", fontWeight: "bold" }}>Mensagens</h2>
      {threads.length === 0 ? (
        <p style={{ padding: "16px", color: "#666" }}>Nenhuma conversa</p>
      ) : (
        threads.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t.author_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 500 }}>{t.author_name}</p>
              <p style={{ fontSize: "12px", color: "#666" }}>{t.last_message_at ? formatTime(t.last_message_at) : ""}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant || !user) return;

    async function loadThreads() {
      try {
        if (isOwner) {
          const { data } = await supabase
            .from("message_threads")
            .select("id, user_id, last_message_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });

          const rows = data || [];
          const userIds = [...new Set(rows.map((t) => t.user_id))];
          const profiles: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
            (profs || []).forEach((p) => { profiles[p.user_id] = p.name; });
          }
          setThreads(rows.map((t) => ({ ...t, author_name: profiles[t.user_id] || "Usuário" })));
        } else {
          const { data: t } = await supabase.from("message_threads").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
          if (t) setThreadId(t.id);
          else {
            const { data: newT } = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
            if (newT) setThreadId(newT.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;

    async function loadMessages() {
      const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
      setMessages(data || []);
    }
    loadMessages();

    const ch = supabase.channel("msg-" + threadId)
      .on("postgres_changes", { event: "INSERT", table: "messages", filter: `thread_id=eq.${threadId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 overflow-hidden">
        {threadId ? (
          <ChatWindow threadId={threadId} messages={messages} onBack={() => setThreadId(null)} />
        ) : isOwner ? (
          <ChatList threads={threads} onSelect={setThreadId} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>{tenant?.name}</p>
            <p style={{ color: "#666", marginBottom: "20px" }}>Nenhuma conversa ainda</p>
            <button
              onClick={async () => {
                if (!tenant || !user) return;
                const { data } = await supabase.from("message_threads").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
                if (data) setThreadId(data.id);
                else {
                  const { data: nt } = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
                  if (nt) setThreadId(nt.id);
                }
              }}
              style={{ padding: "12px 24px", borderRadius: "24px", background: "#25D366", color: "white", border: "none", fontWeight: 500 }}
            >
              Iniciar conversa
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}