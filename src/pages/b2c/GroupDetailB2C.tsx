import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useB2CGroupDetail } from "@/hooks/groups/useB2CGroupDetail";
import { markGroupVisited } from "@/services/groupsB2CService";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Send, Users, Pencil, Trash2, X, Check, CornerDownRight } from "lucide-react";

function getOnboardingKey(groupId: string) {
  return `group_onboarding_${groupId}`;
}

export default function GroupDetailB2C() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group, membersCount, posts, loading, sending, error, canPost, postError, load, sendPost, checkCanPost, editPost, removePost, replies, replyingTo, repliesLoading, sendingReply, openReplies, sendReply } = useB2CGroupDetail(groupId || null);
  const [inputText, setInputText] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [memberCheckDone, setMemberCheckDone] = useState(false);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newReply, setNewReply] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (group && user && groupId) {
      checkCanPost(user.id);
      if (groupId) markGroupVisited(groupId);
    }
  }, [group, user, groupId, checkCanPost]);

  useEffect(() => {
    if (group && groupId) {
      if (!localStorage.getItem(getOnboardingKey(groupId))) {
        setShowOnboarding(true);
      }
    }
  }, [group, groupId]);

  useEffect(() => {
    if (!loading && group && user && groupId && !memberCheckDone) {
      let timer: ReturnType<typeof setTimeout>;
      const checkMembership = async () => {
        try {
          const { data } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (!data) {
            setRemoved(true);
            timer = setTimeout(() => navigate("/groups/b2c"), 2000);
          }
        } catch { /* ignore */ }
        setMemberCheckDone(true);
      };
      checkMembership();
      return () => clearTimeout(timer);
    }
  }, [loading, group, user, groupId, memberCheckDone, navigate]);

  async function handleSend() {
    if (!inputText.trim() || !user || sending) return;
    try {
      const result = await sendPost(user.id, inputText.trim());
      if (result.success) {
        setInputText("");
        if (inputRef.current) inputRef.current.focus();
      }
    } catch { /* ignore */ }
  }

  async function handleEditPost(postId: string) {
    if (!editText.trim()) return;
    try {
      await editPost(postId, editText.trim());
      setEditingPostId(null);
      setEditText("");
    } catch { /* ignore */ }
  }

  async function handleDeletePost(postId: string) {
    try {
      await removePost(postId);
    } catch { /* ignore */ }
  }

  function startEditing(post: { id: string; content: string | null }) {
    setEditingPostId(post.id);
    setEditText(post.content || "");
  }

  function cancelEditing() {
    setEditingPostId(null);
    setEditText("");
  }

  async function handleSendReply(postId: string) {
    if (!user || !newReply.trim() || sendingReply) return;
    const result = await sendReply(postId, user.id, newReply.trim());
    if (result.success) {
      setNewReply("");
    }
  }

  if (loading && !group) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "#e53e3e" }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#630091", color: "#fff", cursor: "pointer" }}>Voltar</button>
      </div>
    );
  }

  if (removed) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "#e53e3e", fontSize: 16 }}>Você não faz mais parte deste grupo</p>
        <p style={{ color: "#888", fontSize: 13 }}>Redirecionando...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #eee", flexShrink: 0, background: "#fff" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={22} color="#666" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: "#333", fontSize: 16, marginBottom: 2 }}>{group.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: group.type === "internal" ? "#e8f4f8" : "#f0e6ff", color: group.type === "internal" ? "#0891b2" : "#7c3aed", fontWeight: 500 }}>
              {group.type === "internal" ? "Interno" : "Privado"}
            </span>
            <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={12} /> {membersCount} membro{membersCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, paddingBottom: 8, background: "#f5f5f5" }}>
        {showOnboarding && (
          <div style={{ background: "linear-gradient(135deg, #630091, #9b30ff)", borderRadius: 12, padding: 20, marginBottom: 16, color: "#fff" }}>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Você foi selecionado para participar deste grupo.</p>
            <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 14, lineHeight: 1.4 }}>
              Aqui você poderá acompanhar mensagens e interagir com participantes.
            </p>
            <button
              onClick={() => {
                setShowOnboarding(false);
                if (groupId) localStorage.setItem(getOnboardingKey(groupId), "true");
              }}
              style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#fff", color: "#630091", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              Entrar
            </button>
          </div>
        )}

        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            <p>Nenhuma mensagem ainda</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Seja o primeiro a postar!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {posts.map((post) => {
              const isAuthor = post.author_id === user?.id;
              return (
                <div key={post.id} style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#630091" }}>{post.profiles?.name?.[0] || "?"}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{post.profiles?.name || "Usuário"}</span>
                    <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{formatTime(post.created_at)}</span>
                  </div>

                  {editingPostId === post.id ? (
                    <div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, outline: "none", resize: "vertical", minHeight: 60, fontFamily: "inherit" }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={cancelEditing}
                          style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" }}
                        >
                          <X size={14} /> Cancelar
                        </button>
                        <button
                          onClick={() => handleEditPost(post.id)}
                          disabled={!editText.trim()}
                          style={{ background: "#630091", border: "none", borderRadius: 8, cursor: "pointer", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#fff", opacity: editText.trim() ? 1 : 0.5 }}
                        >
                          <Check size={14} /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, lineHeight: 1.5, color: "#444", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{post.content}</p>
                  )}

                  <button
                    onClick={() => openReplies(post.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888", marginTop: 8, padding: 0 }}
                  >
                    <CornerDownRight size={14} />
                    Responder
                    {(replies[post.id]?.length || 0) > 0 && ` (${replies[post.id].length})`}
                  </button>

                  {replyingTo === post.id && (
                    <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #e0e0e0" }}>
                      {repliesLoading[post.id] ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
                          <Loader2 className="h-4 w-4 animate-spin" color="#999" />
                        </div>
                      ) : !replies[post.id] || replies[post.id].length === 0 ? (
                        <p style={{ fontSize: 12, color: "#999" }}>Nenhuma resposta ainda</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {replies[post.id].map(reply => (
                            <div key={reply.id} style={{ background: "#f5f5f5", borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: "#555" }}>{reply.profiles?.name || "Usuário"}</span>
                                <span style={{ fontSize: 10, color: "#aaa" }}>{formatTime(reply.created_at)}</span>
                              </div>
                              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.4, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <input
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Escrever resposta..."
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSendReply(post.id); } }}
                          style={{ flex: 1, padding: "6px 10px", borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 13, outline: "none" }}
                        />
                        <button
                          onClick={() => handleSendReply(post.id)}
                          disabled={sendingReply || !newReply.trim()}
                          style={{ width: 32, height: 32, borderRadius: "50%", background: newReply.trim() && !sendingReply ? "#630091" : "#ccc", border: "none", cursor: newReply.trim() && !sendingReply ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          {sendingReply ? <Loader2 className="h-3 w-3 animate-spin" color="#fff" /> : <Send size={12} color="#fff" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {isAuthor && editingPostId !== post.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => startEditing(post)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#630091" }}
                      >
                        <Pencil size={14} /> Editar
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#e53e3e" }}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!canPost && postError && (
        <div style={{ padding: "8px 16px", background: "#fff3e0", borderTop: "1px solid #ffe0b2", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#e65100" }}>{postError}</p>
        </div>
      )}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", background: "#fff", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={canPost ? "Digite sua mensagem..." : "Você não pode publicar neste grupo"}
          disabled={sending || !canPost}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #e0e0e0", fontSize: 14, outline: "none", height: 40, background: canPost ? "#fafafa" : "#f0f0f0" }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending || !canPost}
          style={{ width: 40, height: 40, borderRadius: "50%", background: inputText.trim() && !sending && canPost ? "#630091" : "#ccc", border: "none", cursor: inputText.trim() && !sending && canPost ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" color="#fff" /> : <Send size={16} color="#fff" />}
        </button>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
