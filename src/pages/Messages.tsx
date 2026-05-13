import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft, Send } from "lucide-react";

type Thread = { id: string; user_id: string; last_message_at: string | null; author_name?: string };
type Message = { id: string; thread_id: string; sender_id: string; content: string; created_at: string };

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load threads
  useEffect(() => {
    if (!tenant || !user) return;

    async function load() {
      try {
        if (isOwner) {
          const { data } = await supabase
            .from("message_threads")
            .select("id, user_id, last_message_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });

          const rows = data || [];
          const userIds = rows.map(t => t.user_id);
          const profiles: Record<string, string> = {};
          
          if (userIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
            (profs || []).forEach(p => profiles[p.user_id] = p.name);
          }
          
          setThreads(rows.map(t => ({ ...t, author_name: profiles[t.user_id] || "Usuário" })));
        } else {
          const { data: t } = await supabase.from("message_threads").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
          if (t) setThreadId(t.id);
          else {
            const { data: nt } = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
            if (nt) setThreadId(nt.id);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [tenant?.id, user?.id, isOwner]);

  // Load messages
  useEffect(() => {
    if (!threadId) return;

    async function loadMessages() {
      const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
      setMessages(data || []);
    }
    loadMessages();

    const channel = supabase.channel(`msg-${threadId}`)
      .on("postgres_changes", { event: "INSERT", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]);
        })
      .subscribe();

    return () => { channel.unsubscribe(); supabase.removeChannel(channel); };
  }, [threadId]);

  // Scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => { 
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages.length, threadId]);

  // Send
  async function handleSend() {
    if (!threadId || !user || !inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, content });
    } catch (err) { console.error(err); setInputText(content); }
    finally { setSending(false); }
  }

  const chatName = threadId ? (isOwner ? threads.find(t => t.id === threadId)?.author_name || "Usuário" : tenant?.name || "Marca") : "";
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
      <BottomNav />
    </div>
  );

  if (!isOwner && !threadId) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
      <BottomNav />
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
        
        {/* Chat Window */}
        {threadId ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minHeight: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #e0e0e0", background: "#fff", flexShrink: 0 }}>
              <button onClick={() => setThreadId(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <ArrowLeft size={20} color="#666" />
              </button>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 500, color: "#333" }}>{chatName[0]?.toUpperCase()}</span>
              </div>
              <span style={{ fontWeight: 500, color: "#333" }}>{chatName}</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, paddingBottom: 20, background: "#f5f5f5" }}>
              {messages.map(m => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                    <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 16, background: isMine ? "#25D366" : "#fff", color: isMine ? "#fff" : "#333" }}>
                      <p style={{ fontSize: 14, wordBreak: "break-word" }}>{m.content}</p>
                      <p style={{ fontSize: 10, marginTop: 4, color: isMine ? "rgba(255,255,255,0.7)" : "#888", textAlign: isMine ? "right" : "left" }}>{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input - FIXO EM BAIXO */}
            <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #e0e0e0", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Digite uma mensagem..."
                  disabled={sending}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #ddd", fontSize: 14, outline: "none" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: "50%", background: inputText.trim() && !sending ? "#25D366" : "#ccc", border: "none", cursor: inputText.trim() && !sending ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Send size={18} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chat List */
          <div style={{ flex: 1, overflowY: "auto" }}>
            <h2 style={{ padding: 16, fontSize: 20, fontWeight: "bold" }}>Mensagens</h2>
            {threads.length === 0 ? (
              <p style={{ padding: 16, color: "#666" }}>Nenhuma conversa</p>
            ) : (
              threads.map(t => (
                <button key={t.id} onClick={() => setThreadId(t.id)} style={{ width: "100%", padding: 16, display: "flex", alignItems: "center", gap: 12, border: "none", borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontWeight: 500, color: "#333" }}>{t.author_name?.[0]?.toUpperCase() || "?"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: "#333" }}>{t.author_name}</p>
                    <p style={{ fontSize: 12, color: "#888" }}>{t.last_message_at ? formatTime(t.last_message_at) : ""}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}