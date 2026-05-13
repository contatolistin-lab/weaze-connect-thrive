// =============================================================================
// MENSAGES PAGE - Chat Privado B2C <-> B2B
// =============================================================================
// Arquitetura: Componente único com estados simples
// Realtime: Apenas INSERT, filtrado por thread_id
// Input: Textarea controlado no componente principal
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft, Send as SendIcon } from "lucide-react";

// =============================================================================
// TIPOS
// =============================================================================

type Thread = {
  id: string;
  tenant_id: string;
  user_id: string;
  created_at: string;
  last_message_at: string | null;
  author_name?: string;
  author_avatar?: string;
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

// =============================================================================
// COMPONENTES
// =============================================================================

function ChatList({ 
  threads, 
  onSelect,
  loading 
}: { 
  threads: Thread[]; 
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffHours < 48) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" });
    }
  };

if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // B2C sem thread ainda (criando automaticamente acima)
  if (!isOwner && !threadId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <p style={{ fontWeight: 500, color: "#333", marginBottom: "4px" }}>
              {thread.author_name || "Usuário"}
            </p>
            <p style={{ fontSize: "12px", color: "#888" }}>
              {thread.last_message_at ? formatTime(thread.last_message_at) : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ChatWindow({
  threadId,
  messages,
  chatName,
  onBack,
  inputText,
  setInputText,
  onSend,
  sending,
  scrollRef,
  currentUserId
}: {
  threadId: string;
  messages: Message[];
  chatName: string;
  onBack: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  currentUserId: string | undefined;
}) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderBottom: "1px solid #e8e8e8",
          background: "white",
          height: "60px",
          flexShrink: 0,
          boxSizing: "border-box"
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px"
          }}
        >
          <ArrowLeft size={20} color="#666" />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#e8e8e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span style={{ fontWeight: 500, color: "#333", fontSize: "14px" }}>
            {chatName[0]?.toUpperCase() || "?"}
          </span>
        </div>
        <span style={{ fontWeight: 500, color: "#333" }}>{chatName}</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          padding: "16px",
          background: "#f5f5f5",
          minHeight: "200px"
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Nenhuma mensagem ainda
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  marginBottom: "8px"
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    background: isMine ? "#25D366" : "#e8e8e8",
                    color: isMine ? "white" : "#333"
                  }}
                >
                  <p style={{ fontSize: "14px", wordBreak: "break-word" }}>
                    {msg.content}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      marginTop: "4px",
                      color: isMine ? "rgba(255,255,255,0.7)" : "#888",
                      textAlign: isMine ? "right" : "left"
                    }}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          background: "white",
          borderTop: "1px solid #e8e8e8",
          flexShrink: 0,
          height: "70px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Digite uma mensagem..."
            disabled={sending}
            rows={1}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "20px",
              border: "1px solid #ddd",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              minHeight: "40px",
              maxHeight: "100px",
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={onSend}
            disabled={!inputText.trim() || sending}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: inputText.trim() && !sending ? "#25D366" : "#ccc",
              border: "none",
              cursor: inputText.trim() && !sending ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <SendIcon size={18} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  
  // Estados
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // =============================================================================
  // CARREGAR THREADS (apenas B2B)
  // =============================================================================
  useEffect(() => {
    if (!tenant || !user) return;

    async function loadThreads() {
      try {
        if (isOwner) {
          // B2B: buscar todas as threads da comunidade
          const { data, error } = await supabase
            .from("message_threads")
            .select("id, tenant_id, user_id, created_at, last_message_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });

          if (error) throw error;

          const rows = data || [];
          const userIds = [...new Set(rows.map((t) => t.user_id))];
          
          // Buscar nomes dos usuários
          const profiles: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("user_id, name")
              .in("user_id", userIds);
            
            (profs || []).forEach((p) => {
              profiles[p.user_id] = p.name;
            });
          }

          setThreads(
            rows.map((t) => ({
              ...t,
              author_name: profiles[t.user_id] || "Usuário"
            }))
          );
        } else {
          // B2C: buscar ou criar thread
          const { data: existing } = await supabase
            .from("message_threads")
            .select("id")
            .eq("tenant_id", tenant.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (existing) {
            setThreadId(existing.id);
          } else {
            const { data: created } = await supabase
              .from("message_threads")
              .insert({
                tenant_id: tenant.id,
                user_id: user.id
              })
              .select("id")
              .single();

            if (created) {
              setThreadId(created.id);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar threads:", err);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, [tenant?.id, user?.id, isOwner]);

  // =============================================================================
  // CARREGAR MENSAGENS
  // =============================================================================
  useEffect(() => {
    if (!threadId) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, thread_id, sender_id, content, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }

      setMessages(data || []);
    }

    loadMessages();

    // Realtime
    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          // Prevenir duplicatas
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // =============================================================================
  // SCROLL AUTOMÁTICO
  // =============================================================================
  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages.length, threadId]);

  // =============================================================================
  // ENVIAR MENSAGEM
  // =============================================================================
  async function handleSend() {
    if (!threadId || !user || !inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content
        });

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao enviar:", err);
      setInputText(content); // Restaurar texto em caso de erro
    } finally {
      setSending(false);
    }
  }

  // =============================================================================
  // OBTER NOME DO CHAT
  // =============================================================================
  const getChatName = () => {
    if (!threadId) return "";
    if (isOwner) {
      const thread = threads.find((t) => t.id === threadId);
      return thread?.author_name || "Usuário";
    }
    return tenant?.name || "Marca";
  };

  // =============================================================================
  // RENDER
  // =============================================================================
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

  // B2C sem thread ainda (criando automaticamente acima)
  if (!isOwner && !threadId) {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {threadId ? (
          <ChatWindow
            threadId={threadId}
            messages={messages}
            chatName={getChatName()}
            onBack={() => setThreadId(null)}
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSend}
            sending={sending}
            scrollRef={scrollRef}
            currentUserId={user?.id}
          />
        ) : (
          <ChatList
            threads={threads}
            onSelect={setThreadId}
            loading={loading}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}