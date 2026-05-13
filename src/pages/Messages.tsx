import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft, Send } from "lucide-react";

type Thread = { id: string; user_id: string; last_message_at: string | null; author_name?: string; author_avatar?: string };
type Message = { id: string; thread_id: string; sender_id: string; content: string; created_at: string };

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(searchParams.get("thread"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          const profiles: Record<string, { name: string; avatar_url?: string }> = {};
          
          if (userIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds);
            (profs || []).forEach(p => profiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url });
          }
          
          setThreads(rows.map(t => ({ 
            ...t, 
            author_name: profiles[t.user_id]?.name || "Usuário",
            author_avatar: profiles[t.user_id]?.avatar_url || undefined
          })));
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

  useEffect(() => {
    if (!threadId) return;

    async function loadMessages() {
      setLoadingMessages(true);
      const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
      setMessages(data || []);
      setLoadingMessages(false);
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, threadId]);

  async function handleSend() {
    if (!threadId || !user || !inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText("");
    setSending(true);
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      thread_id: threadId,
      sender_id: user.id,
      content: content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const { data, error } = await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, content }).select().single();
      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }
    } catch (err) { 
      console.error(err); 
      setInputText(content);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    finally { setSending(false); }
  }

  const currentThread = threadId ? threads.find(t => t.id === threadId) : null;
  const chatName = threadId ? (isOwner ? currentThread?.author_name || "Usuário" : tenant?.name || "Marca") : "";
  const chatAvatar = isOwner ? currentThread?.author_avatar : null;
  
  const formatDateTime = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleString("pt-BR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });
  };

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
      {!threadId && <TopBar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", height: "100%" }}>
        
        {threadId ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #e8e8e8", background: "#fff", flexShrink: 0 }}>
              <button onClick={() => setThreadId(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <ArrowLeft size={20} color="#666" />
              </button>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {chatAvatar ? (
                  <img src={chatAvatar} alt={chatName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontWeight: 500, color: "#630091" }}>{chatName[0]?.toUpperCase()}</span>
                )}
              </div>
              <span style={{ fontWeight: 500, color: "#333" }}>{chatName}</span>
            </div>

            <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, paddingBottom: 20, background: "#f5f5f5", maxHeight: "calc(100vh - 200px)" }}>
              {loadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#888", padding: 20 }}>Sem mensagens ainda</p>
              ) : (
                <>
                  {messages.map(m => {
                    const isMine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                        <div style={{ 
                          maxWidth: "75%", 
                          padding: "12px 16px", 
                          borderRadius: 20, 
                          background: isMine ? "#630091" : "#f5f5f5", 
                          color: isMine ? "#fff" : "#333",
                          borderBottomRightRadius: isMine ? "4px" : "20px",
                          borderBottomLeftRadius: isMine ? "20px" : "4px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}>
                          <p style={{ fontSize: 14, wordBreak: "break-word", lineHeight: 1.4 }}>{m.content}</p>
                          <p style={{ fontSize: 10, marginTop: 6, color: isMine ? "rgba(255,255,255,0.7)" : "#888", textAlign: isMine ? "right" : "left" }}>{formatDateTime(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div style={{ 
              padding: "12px 16px", 
              background: "#fff", 
              borderTop: "1px solid #e0e0e0", 
              flexShrink: 0, 
              minHeight: 60, 
              display: "flex", 
              alignItems: "center",
              position: "sticky",
              bottom: 0,
              zIndex: 100,
              width: "100%"
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Digite uma mensagem..."
                  disabled={sending}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #e0e0e0", fontSize: 14, outline: "none", height: 40, background: "#fafafa" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: "50%", background: inputText.trim() && !sending ? "#d81e62" : "#ccc", border: "none", cursor: inputText.trim() && !sending ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: inputText.trim() && !sending ? "0 2px 8px rgba(216, 30, 98, 0.3)" : "none" }}
                >
                  <Send size={18} color="#fff" style={{ marginLeft: 2 }} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <h2 style={{ padding: 16, fontSize: 20, fontWeight: "bold" }}>Mensagens</h2>
            {threads.length === 0 ? (
              <p style={{ padding: 16, color: "#666" }}>Nenhuma conversa</p>
            ) : (
              threads.map(t => (
                <button key={t.id} onClick={() => setThreadId(t.id)} style={{ width: "100%", padding: 16, display: "flex", alignItems: "center", gap: 12, border: "none", borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.author_avatar ? (
                      <img src={t.author_avatar} alt={t.author_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontWeight: 500, color: "#630091", fontSize: 18 }}>{t.author_name?.[0]?.toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: "#333", fontSize: 16 }}>{t.author_name}</p>
                    <p style={{ fontSize: 12, color: "#666" }}>{formatDateTime(t.last_message_at)}</p>
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