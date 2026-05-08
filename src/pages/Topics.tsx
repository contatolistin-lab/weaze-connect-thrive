import { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageCircle, Plus, Send, MoreVertical, Pencil, Trash2, X, Check, AtSign } from "lucide-react";
import { awardPoints } from "@/lib/gamification";

type Topic = {
  id: string;
  tenant_id: string;
  related_post_id: string | null;
  title: string;
  created_by: string | null;
  replies_count: number;
  last_activity_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null } | null;
  first_message?: { content: string } | null;
};

type TopicMessage = {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null };
};

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Topics() {
  const { tenant } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const postId = searchParams.get("post");
  const topicIdFromParams = params.topicId;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionUsers, setMentionUsers] = useState<{id: string; name: string; avatar_url?: string}[]>([]);
  const [replyToMsg, setReplyToMsg] = useState<{id: string; name: string; content: string} | null>(null);
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<TopicMessage | null>(null);

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data: topicsData, error } = await supabase
      .from("topics")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false })
      .limit(30);

    if (!error && topicsData) {
      const topicsWithFirstMsg = await Promise.all(
        topicsData.map(async (topic) => {
          const { data: firstMsg } = await supabase
            .from("topic_messages")
            .select("content")
            .eq("topic_id", topic.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", topic.created_by)
            .maybeSingle();
          return { ...topic, first_message: firstMsg, profiles: profile };
        })
      );
      setTopics(topicsWithFirstMsg);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTopics();
  }, [tenant]);

  useEffect(() => {
    if (postId && topics.length > 0) {
      const topic = topics.find(t => t.related_post_id === postId);
      if (topic) openTopic(topic);
    }
  }, [postId, topics]);

  useEffect(() => {
    if (topicIdFromParams && topics.length > 0) {
      const topic = topics.find(t => t.id === topicIdFromParams);
      if (topic) openTopic(topic);
    }
  }, [topicIdFromParams, topics]);

  const createTopic = async () => {
    if (!tenant || !user || !newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("topics")
      .insert({ tenant_id: tenant.id, title: newTitle, created_by: user.id })
      .select()
      .single();

    if (!error && data) {
      setTopics([data, ...topics]);
      setShowCreate(false);
      setNewTitle("");
      openTopic(data);
      await awardPoints(user.id, tenant.id, "topic_creation");
    }
    setCreating(false);
  };

  const openTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingMessages(true);
    const { data: msgs } = await supabase
      .from("topic_messages")
      .select("*, profiles(name, avatar_url)")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    setMessages((msgs || []) as TopicMessage[]);
    setLoadingMessages(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const closeTopic = () => {
    setSelectedTopic(null);
    setMessages([]);
    navigate("/conversas");
  };

  const sendReply = async () => {
    if (!selectedTopic || !user || !newReply.trim()) return;
    setSendingReply(true);
    const { data, error } = await supabase
      .from("topic_messages")
      .insert({
        topic_id: selectedTopic.id,
        user_id: user.id,
        content: newReply.trim(),
        parent_id: replyToMsg?.id || null,
      })
      .select("*, profiles(name, avatar_url)")
      .single();

    if (!error && data) {
      setMessages([...messages, data as TopicMessage]);
      setNewReply("");
      setReplyToMsg(null);
      await awardPoints(user.id, selectedTopic.tenant_id, "reply");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setSendingReply(false);
  };

  const startEditMessage = (msg: TopicMessage) => {
    setEditingMsgId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEditMessage = () => {
    setEditingMsgId(null);
    setEditContent("");
  };

  const saveEditMessage = async () => {
    if (!editingMsgId || !editContent.trim()) return;
    const { error } = await supabase
      .from("topic_messages")
      .update({ content: editContent.trim() })
      .eq("id", editingMsgId);
    if (!error) {
      setMessages(messages.map(m => m.id === editingMsgId ? { ...m, content: editContent.trim() } : m));
    }
    cancelEditMessage();
  };

  const confirmDeleteMessage = (msg: TopicMessage) => {
    setDeleteConfirmMsg(msg);
  };

  const executeDeleteMessage = async () => {
    if (!deleteConfirmMsg) return;
    const { error } = await supabase.from("topic_messages").delete().eq("id", deleteConfirmMsg.id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== deleteConfirmMsg.id));
    }
    setDeleteConfirmMsg(null);
  };

  const replyToMessage = (msg: TopicMessage) => {
    setReplyToMsg({ id: msg.id, name: msg.profiles?.name || "Usuário", content: msg.content });
  };

  const cancelReply = () => {
    setReplyToMsg(null);
  };

  const loadMentionUsers = async () => {
    if (!selectedTopic || !user) return;
    const { data: msgs } = await supabase
      .from("topic_messages")
      .select("user_id, profiles(name, avatar_url)")
      .eq("topic_id", selectedTopic.id);
    if (msgs) {
      const seen = new Set<string>();
      const uniqueUsers: {id: string; name: string; avatar_url?: string}[] = [];
      msgs.forEach(msg => {
        if (!seen.has(msg.user_id)) {
          seen.add(msg.user_id);
          uniqueUsers.push({ id: msg.user_id, name: msg.profiles?.name || "User", avatar_url: msg.profiles?.avatar_url });
        }
      });
      if (selectedTopic?.created_by && !seen.has(selectedTopic.created_by)) {
        const { data: profile } = await supabase.from("profiles").select("id, name, avatar_url").eq("user_id", selectedTopic.created_by).single();
        if (profile) uniqueUsers.push({ id: profile.id, name: profile.name, avatar_url: profile.avatar_url });
      }
      if (user && !seen.has(user.id)) {
        uniqueUsers.push({ id: user.id, name: (user as any).user_metadata?.name || "Você", avatar_url: (user as any).user_metadata?.avatar_url });
      }
      setMentionUsers(uniqueUsers);
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewReply(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = value.slice(lastAt + 1);
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt);
        if (!showMentionList) loadMentionUsers();
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (name: string) => {
    const lastAt = newReply.lastIndexOf("@");
    const newValue = newReply.slice(0, lastAt) + "@" + name + " ";
    setNewReply(newValue);
    setShowMentionList(false);
  };

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-100">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-100">
      <TopBar />
      <main className="flex-1 pb-20">
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
          <p className="text-sm text-gray-500 mt-1">Discussões da comunidade</p>
        </div>

        {isB2B && (
          <div className="p-4">
            <button onClick={() => setShowCreate(true)} className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" /> Criar nova conversa
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhuma conversa ainda</p>
            <p className="text-sm text-gray-400">{isB2B ? "Crie uma conversa para engajar sua comunidade" : "Comente em um post para começar"}</p>
          </div>
        ) : (
          <div className="bg-white">
            {topics.map((topic) => (
              <div key={topic.id} onClick={() => openTopic(topic)} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {topic.is_pinned && <span className="text-amber-600 mr-1">📌</span>}
                    {topic.title || "Sem título"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {topic.first_message?.content || "Sem mensagens"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{topic.replies_count || 0} respostas</p>
                    <p className="text-xs text-green-600 font-medium">
                      {topic.last_activity_at && new Date(topic.last_activity_at).getTime() > Date.now() - 60000 ? "● Ativo agora" : `Última: ${formatTime(topic.last_activity_at)}`}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={topic.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-600">{topic.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Sobre o que você quer conversar?" className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-32" />
            <button onClick={createTopic} disabled={creating || !newTitle.trim()} className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50">
              {creating ? "Criando..." : "Criar conversa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedTopic && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <button onClick={closeTopic} className="text-gray-500 p-1">←</button>
            <h2 className="text-base font-medium text-gray-900 flex-1 truncate">{selectedTopic.title || "Carregando..."}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="text-center text-gray-500">Carregando...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p>Seja o primeiro a participar!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-600">{msg.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{msg.profiles?.name || "Usuário"}</span>
                      <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                      {msg.user_id !== user?.id && (
                        <button onClick={() => replyToMessage(msg)} className="text-xs text-purple-600 hover:text-purple-800 ml-2">Responder</button>
                      )}
                    </div>
                    {editingMsgId === msg.id ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-2 text-xs text-purple-600">
                          <Pencil className="h-3 w-3" />
                          <span>Editando mensagem</span>
                        </div>
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none" rows={2} autoFocus onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditMessage(); } if (e.key === "Escape") cancelEditMessage(); }} />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">Enter para salvar, Esc para cancelar</span>
                          <div className="flex gap-2">
                            <button onClick={cancelEditMessage} className="text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors">Cancelar</button>
                            <button onClick={saveEditMessage} disabled={!editContent.trim()} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50">Salvar</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                    {msg.user_id === user?.id && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => startEditMessage(msg)} className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors">
                          <Pencil className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => confirmDeleteMessage(msg)} className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3 w-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!selectedTopic.is_locked && (
            <div className="p-4 border-t border-gray-200 bg-white">
              {replyToMsg && (
                <div className="mb-2 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <span className="text-xs text-purple-600 font-medium">Respondendo a @{replyToMsg.name}</span>
                    <p className="text-xs text-gray-500 truncate">{replyToMsg.content}</p>
                  </div>
                  <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {showMentionList && mentionUsers.length > 0 && (
                <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionUsers.filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).map(u => (
                    <button key={u.id} onClick={() => insertMention(u.name)} className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="text-xs bg-gray-200">{u.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>@{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="text" value={newReply} onChange={handleReplyChange} placeholder="Escreva sua resposta... (@ para mencionar)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !showMentionList) { e.preventDefault(); sendReply(); } if (e.key === "Escape") setShowMentionList(false); }} />
                  <AtSign className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <button onClick={sendReply} disabled={sendingReply || !newReply.trim()} className="bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-lg disabled:opacity-50">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!deleteConfirmMsg} onOpenChange={() => setDeleteConfirmMsg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Excluir mensagem
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.</p>
            {deleteConfirmMsg && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 line-clamp-2">"{deleteConfirmMsg.content}"</div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmMsg(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={executeDeleteMessage} className="bg-red-500 hover:bg-red-600">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}