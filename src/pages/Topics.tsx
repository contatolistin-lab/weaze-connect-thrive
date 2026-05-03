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
  user_id: string | null;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  reply_to_message_id?: string | null;
  profiles?: { name: string; avatar_url: string | null } | null;
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
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
  
  // Editar mensagem
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  
  // Excluir mensagem
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  
  // Menção (@usuário)
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionUsers, setMentionUsers] = useState<{id: string; name: string; avatar_url?: string}[]>([]);
  
  // Resposta direta
  const [replyToMsg, setReplyToMsg] = useState<{id: string; name: string; content: string} | null>(null);
  
  // Tópicos em alta (com engajamento)
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  
  // Dialog de confirmação para excluir
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<any | null>(null);

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    
    // Buscar todos os tópicos
    const { data: topicsData, error } = await supabase
      .from("topics")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("is_pinned", { ascending: false })
      .order("replies_count", { ascending: false })
      .limit(30);
    
    if (error) { console.error("Load topics error:", error); setLoading(false); return; }
    
    // Filtrar tópicos com engajamento (replies_count > 0) para "Em alta"
    const trending = (topicsData || []).filter(t => t.replies_count > 0).slice(0, 5);
    setTrendingTopics(trending);
    
    // Processar todos os tópicos com preview
    const topicsWithMessages = await Promise.all((topicsData || []).map(async (topic) => {
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
        .single();
      return { ...topic, first_message: firstMsg, profiles: profile };
    }));
    
    setTopics(topicsWithMessages);
    setLoading(false);
  };

  const loadDirectTopic = async () => {
    if (!tenant || !topicIdFromParams) return;
    
    setLoadingMessages(true);
    setSelectedTopic(null);
    setMessages([]);
    
    console.log("Loading direct topic:", topicIdFromParams, "tenant:", tenant.id);
    
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicIdFromParams)
      .single();
    
    if (topicError) { 
      console.error("Topic load error:", topicError);
      setLoadingMessages(false); 
      return; 
    }
    
    console.log("Topic found:", topic);
    setSelectedTopic(topic);
    
    // Simple query without join
    const { data: msgs, error: msgError } = await supabase
      .from("topic_messages")
      .select("*")
      .eq("topic_id", topicIdFromParams)
      .order("created_at", { ascending: false });
    
    console.log("Messages loaded:", msgs, "error:", msgError);
    
    if (msgError || !msgs) {
      console.error("Load messages error:", msgError);
      setLoadingMessages(false);
      setMessages([]);
      return;
    }
    
    // Fetch profiles separately
    const userIds = [...new Set(msgs.map(m => m.user_id).filter(Boolean))];
    let profilesMap: Record<string, { name: string; avatar_url: string }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);
      
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
        });
      }
    }
    
    // Add profile data to messages
    const msgsWithProfiles = msgs.map(m => ({
      ...m,
      profiles: profilesMap[m.user_id] || null
    }));
    
    console.log("Messages with profiles:", msgsWithProfiles);
    setLoadingMessages(false);
    setMessages(msgsWithProfiles);
  };

  useEffect(() => {
    if (tenant) loadTopics();
  }, [tenant]);

  useEffect(() => {
    console.log("EFFECT: topicIdFromParams=", topicIdFromParams, "tenant=", !!tenant);
    if (topicIdFromParams && tenant) {
      loadDirectTopic();
    }
  }, [topicIdFromParams, tenant]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/topics" || path === "/community") {
      navigate("/conversas", { replace: true });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const createTopic = async () => {
    if (!tenant || !user || !newTitle.trim()) return;
    setCreating(true);
    
    const content = newTitle.trim();
    
    const { data: topicData, error: topicError } = await supabase.from("topics").insert({
      tenant_id: tenant.id,
      related_post_id: postId,
      title: content.substring(0, 100),
      created_by: user.id,
    }).select().single();
    
    if (topicError) {
      setCreating(false);
      toast.error(topicError.message);
      return;
    }
    
    await supabase.from("topic_messages").insert({
      topic_id: topicData.id,
      user_id: user.id,
      content: content,
    });
    
    setCreating(false);
    toast.success("Conversa criada!");
    setShowCreate(false);
    setNewTitle("");
    loadTopics();
  };

  const loadTopicMessages = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingMessages(true);
    
    console.log("Loading messages for topic:", topic.id);
    
    const { data, error } = await supabase
      .from("topic_messages")
      .select("*, profiles:profiles!topic_messages_user_id_fkey(name, avatar_url)")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: false });
    
    console.log("Messages loaded:", data, "error:", error);
    
    setLoadingMessages(false);
    if (error) { 
      console.error("Load messages error:", error);
      return; 
    }
    setMessages((data as any) || []);
  };

  const sendReply = async () => {
    if (!selectedTopic || !user || !newReply.trim()) return;
    setSendingReply(true);
    
    const content = newReply.trim();
    
    // Processar menção: extrair @username do texto
    const mentionMatch = content.match(/@(\w+)/);
    let mentionedUserId: string | null = null;
    
    if (mentionMatch && mentionUsers.length > 0) {
      const mentionedName = mentionMatch[1];
      const mentionedUser = mentionUsers.find(u => u.name.toLowerCase() === mentionedName.toLowerCase());
      if (mentionedUser) {
        mentionedUserId = mentionedUser.id;
      }
    }
    
    // Se não encontrou na lista, buscar pelo nome
    if (!mentionedUserId && mentionMatch) {
      const mentionedName = mentionMatch[1];
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("name", mentionedName)
        .limit(1)
        .single();
      if (profile) mentionedUserId = profile.user_id;
    }
    
    const insertData: any = {
      topic_id: selectedTopic.id,
      user_id: user.id,
      content: content,
    };
    
    // Adicionar referência de resposta se existir
    if (replyToMsg) {
      insertData.reply_to_message_id = replyToMsg.id;
    }
    
    // Adicionar mentioned_user_id se encontrado
    if (mentionedUserId) {
      insertData.mentioned_user_id = mentionedUserId;
    }
    
    const { error: insertError, data: insertedMsg } = await supabase
      .from("topic_messages")
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error("Insert error:", insertError);
      setSendingReply(false);
      toast.error("Erro ao enviar");
      return;
    }
    
    const userName = (user as any).user_metadata?.name || (user as any).email || "Alguém";
    // Notificar usuário mencionado
    if (mentionedUserId && mentionedUserId !== user.id && tenant) {
      await supabase.from("notifications").insert({
        user_id: mentionedUserId,
        tenant_id: tenant.id,
        type: "mention",
        title: `${userName} te mencionou em uma conversa`,
        body: content,
        data: { message_id: insertedMsg.id, related_type: "topic_message" },
      } as any);
    }
    
    // Notificar autor da mensagem respondida
    if (replyToMsg && tenant) {
      const { data: originalMsg } = await supabase
        .from("topic_messages")
        .select("user_id")
        .eq("id", replyToMsg.id)
        .single();
      
      if (originalMsg && originalMsg.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: originalMsg.user_id,
          tenant_id: tenant.id,
          type: "reply",
          title: `${userName} respondeu sua mensagem`,
          body: content,
          data: { message_id: insertedMsg.id, related_type: "topic_message" },
        } as any);
      }
    }
    
    await supabase.from("topics").update({
      last_activity_at: new Date().toISOString(),
      replies_count: (selectedTopic.replies_count || 0) + 1,
    }).eq("id", selectedTopic.id);
    
    setSendingReply(false);
    setNewReply("");
    setReplyToMsg(null);
    await loadTopicMessages(selectedTopic);
    loadTopics();
    if (tenant) awardPoints(user.id, tenant.id, "reply_created", selectedTopic.id, 3);
  };

  const closeTopic = () => {
    setSelectedTopic(null);
    setMessages([]);
    navigate("/conversas");
  };

  // Editar mensagem
  const startEditMessage = (msg: any) => {
    if (msg.user_id !== user?.id) {
      toast.error("Você só pode editar suas próprias mensagens");
      return;
    }
    setEditingMsgId(msg.id);
    setEditContent(msg.content);
  };

  const saveEditMessage = async () => {
    if (!editingMsgId || !editContent.trim()) return;
    
    const { error } = await supabase
      .from("topic_messages")
      .update({ content: editContent.trim(), edited_at: new Date().toISOString() } as any)
      .eq("id", editingMsgId);

    if (error) {
      toast.error("Erro ao editar mensagem");
      return;
    }

    setEditingMsgId(null);
    setEditContent("");
    if (selectedTopic) loadTopicMessages(selectedTopic);
    toast.success("Mensagem editada");
  };

  const cancelEditMessage = () => {
    setEditingMsgId(null);
    setEditContent("");
  };

  // Excluir mensagem - abrir confirmação
  const confirmDeleteMessage = (msg: any) => {
    if (msg.user_id !== user?.id && user?.role !== "brand") {
      toast.error("Você não pode excluir esta mensagem");
      return;
    }
    setDeleteConfirmMsg(msg);
  };

  // Executar exclusão após confirmação
  const executeDeleteMessage = async () => {
    if (!deleteConfirmMsg) return;
    
    const { error } = await supabase
      .from("topic_messages")
      .delete()
      .eq("id", deleteConfirmMsg.id);

    if (error) {
      toast.error("Erro ao excluir mensagem");
      return;
    }

    setMessages(messages.filter(m => m.id !== deleteConfirmMsg.id));
    setDeleteConfirmMsg(null);
    toast.success("Mensagem excluída");
  };

  // Carregar usuários para menção
  const loadMentionUsers = async () => {
    if (!tenant) return;
    
    const { data } = await supabase
      .from("topic_messages")
      .select("user_id, profiles:profiles!topic_messages_user_id_fkey(id, name, avatar_url)")
      .eq("topic_id", selectedTopic?.id)
      .limit(50);

    if (data) {
      const uniqueUsers: any[] = [];
      const seen = new Set();
      data.forEach((msg: any) => {
        if (msg.profiles && !seen.has(msg.profiles.id)) {
          seen.add(msg.profiles.id);
          uniqueUsers.push({ 
            id: msg.profiles.id, 
            name: msg.profiles.name,
            avatar_url: msg.profiles.avatar_url
          });
        }
      });
      // Adicionar autor do tópico
      if (selectedTopic?.created_by && !seen.has(selectedTopic.created_by)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("user_id", selectedTopic.created_by)
          .single();
        if (profile) uniqueUsers.push({ id: profile.id, name: profile.name, avatar_url: profile.avatar_url });
      }
      // Adicionar usuário atual
      if (user && !seen.has(user.id)) {
        uniqueUsers.push({ id: user.id, name: (user as any).user_metadata?.name || "Você", avatar_url: (user as any).user_metadata?.avatar_url });
      }
      setMentionUsers(uniqueUsers);
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewReply(value);
    
    // Detectar @ para menção
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

  const insertMention = (userName: string) => {
    const lastAt = newReply.lastIndexOf("@");
    const newValue = newReply.slice(0, lastAt) + "@" + userName + " ";
    setNewReply(newValue);
    setShowMentionList(false);
  };

  // Responder diretamente a uma mensagem
  const replyToMessage = (msg: any) => {
    setReplyToMsg({ id: msg.id, name: msg.profiles?.name || "Usuário", content: msg.content });
    setNewReply("@" + (msg.profiles?.name || "Usuário") + " ");
    // Also load mention users if not loaded
    if (mentionUsers.length === 0) loadMentionUsers();
  };

  const cancelReply = () => {
    setReplyToMsg(null);
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
      
      {/* Main Content */}
      <main className="flex-1 pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
          <p className="text-sm text-gray-500 mt-1">Discussões da comunidade</p>
        </div>

        {/* Em Alta - Apenas tópicos com engajamento real */}
        {trendingTopics.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold text-amber-800">Em alta</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/conversas/${topic.id}`)}
                  className="flex-shrink-0 bg-white border border-amber-200 rounded-lg px-3 py-2 text-left hover:bg-amber-50 min-w-[140px]"
                >
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{topic.title || "Conversa"}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {topic.replies_count} {topic.replies_count === 1 ? "resposta" : "respostas"}
                    {topic.last_activity_at && (
                      <span className="text-gray-400 ml-1">• {formatTime(topic.last_activity_at)}</span>
                    )}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Create Button - B2B Only */}
        {isB2B && (
          <div className="p-4">
            <button 
              onClick={() => setShowCreate(true)}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Criar nova conversa
            </button>
          </div>
        )}
        
        {/* Topic List - Forum Style */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhuma conversa ainda</p>
            {isB2B ? (
              <p className="text-sm text-gray-400">Crie uma conversa para engajar sua comunidade</p>
            ) : (
              <p className="text-sm text-gray-400">Comente em um post para começar</p>
            )}
          </div>
        ) : (
          <div className="bg-white">
            {topics.map((topic) => (
              <div 
                key={topic.id} 
                onClick={() => navigate(`/conversas/${topic.id}`)}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                {/* Left - Title & Preview */}
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {topic.is_pinned && <span className="text-amber-600 mr-1">📌</span>}
                    {topic.title || "Sem título"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {topic.first_message?.content || "Sem mensagens"}
                  </p>
                </div>
                
                {/* Right - Stats & Avatar */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{topic.replies_count || 0} respostas</p>
                    <p className="text-xs text-green-600 font-medium">
                      {topic.last_activity_at && new Date(topic.last_activity_at).getTime() > Date.now() - 60000 
                        ? "● Ativo agora" 
                        : `Última: ${formatTime(topic.last_activity_at)}`}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={topic.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                      {topic.profiles?.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Sobre o que você quer conversar?"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-32"
            />
            <button 
              onClick={createTopic}
              disabled={creating || !newTitle.trim()}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {creating ? "Criando..." : "Criar conversa"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Detail View - Always render if we have a selectedTopic or messages */}
      {(selectedTopic || messages.length > 0) && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {void console.log("RENDER: selectedTopic=", selectedTopic, "messages=", messages.length)}
          {/* Topic Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <button onClick={closeTopic} className="text-gray-500 p-1">←</button>
            <h2 className="text-base font-medium text-gray-900 flex-1 truncate">
              {selectedTopic?.title || "Carregando..."}
            </h2>
          </div>
          
          {/* Messages */}
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
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                      {msg.profiles?.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {msg.profiles?.name || "Usuário"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.created_at)}
                      </span>
                      {msg.user_id !== user?.id && (
                        <button 
                          onClick={() => replyToMessage(msg)}
                          className="text-xs text-purple-600 hover:text-purple-800 ml-2"
                        >
                          Responder
                        </button>
                      )}
                      {msg.user_id === user?.id && (
                        <div className="flex gap-2 ml-auto">
                          <button 
                            onClick={() => startEditMessage(msg)}
                            className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => confirmDeleteMessage(msg)}
                            className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Mostrar se é resposta a outra mensagem */}
                    {msg.reply_to_message_id && (
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <span className="text-purple-600">↩</span>
                        Respondendo a mensagem
                      </div>
                    )}
                    {editingMsgId === msg.id ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-2 text-xs text-purple-600">
                          <Pencil className="h-3 w-3" />
                          <span>Editando mensagem</span>
                        </div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                          rows={2}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEditMessage();
                            }
                            if (e.key === "Escape") cancelEditMessage();
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">Enter para salvar, Esc para cancelar</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={cancelEditMessage}
                              className="text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={saveEditMessage}
                              disabled={!editContent.trim()}
                              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Reply Input */}
          {selectedTopic && !selectedTopic.is_locked && (
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Mostrar resposta atual */}
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
              {/* Mention dropdown */}
              {showMentionList && mentionUsers.length > 0 && (
                <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionUsers
                    .filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u.name)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm flex items-center gap-2"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={u.avatar_url || ""} />
                          <AvatarFallback className="text-xs bg-gray-200">{u.name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>@{u.name}</span>
                      </button>
                    ))
                  }
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newReply}
                    onChange={handleReplyChange}
                    placeholder="Escreva sua resposta... (@ para mencionar)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !showMentionList) {
                        e.preventDefault();
                        sendReply();
                      }
                      if (e.key === "Escape") setShowMentionList(false);
                    }}
                  />
                  <AtSign className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <button 
                  onClick={sendReply}
                  disabled={sendingReply || !newReply.trim()}
                  className="bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-lg disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog de confirmação para excluir mensagem */}
      <Dialog open={!!deleteConfirmMsg} onOpenChange={() => setDeleteConfirmMsg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Excluir mensagem
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </p>
            {deleteConfirmMsg && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 line-clamp-2">
                "{deleteConfirmMsg.content}"
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmMsg(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={executeDeleteMessage}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}