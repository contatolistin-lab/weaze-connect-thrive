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
import { MessageCircle, Plus, Send } from "lucide-react";

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

type Mention = { user_id: string; name: string };

type TopicMessage = {
  id: string;
  topic_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  mentions?: Mention[];
  profiles?: { name: string; avatar_url: string | null } | null;
};

type MentionUser = { user_id: string; name: string; avatar_url: string | null };

function slugifyMention(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function MessageContent({ content, mentions }: { content: string; mentions?: Mention[] }) {
  const handles = (mentions || []).map((m) => slugifyMention(m.name)).filter(Boolean);
  const pattern = handles.length
    ? new RegExp(`(@(?:${handles.join("|")})|@[\\p{L}0-9_]+)`, "gu")
    : /(@[\p{L}0-9_]+)/gu;
  const parts = content.split(pattern);
  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part?.startsWith("@")) {
          const handle = part.slice(1);
          const isKnown = handles.includes(handle.toLowerCase());
          return (
            <span
              key={i}
              className={isKnown ? "text-blue-600 font-medium" : "text-blue-500"}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

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
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [tenantUsers, setTenantUsers] = useState<MentionUser[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number>(-1);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: mbs } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("tenant_id", tenant.id);
      const ids = Array.from(new Set((mbs || []).map((m: any) => m.user_id)));
      if (ids.length === 0) { setTenantUsers([]); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", ids);
      setTenantUsers((profs || []) as MentionUser[]);
    })();
  }, [tenant?.id]);

  const filteredMentionUsers = tenantUsers
    .filter((u) => u.name && (mentionQuery === "" || u.name.toLowerCase().includes(mentionQuery.toLowerCase())))
    .slice(0, 6);

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewReply(value);
    const caret = e.target.selectionStart ?? value.length;
    const upToCaret = value.slice(0, caret);
    const match = upToCaret.match(/(?:^|\s)@([\p{L}0-9_]*)$/u);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1]);
      setMentionStart(caret - match[1].length - 1);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(-1);
    }
  };

  const selectMention = (u: MentionUser) => {
    if (mentionStart < 0) return;
    const handle = slugifyMention(u.name);
    const before = newReply.slice(0, mentionStart);
    const after = newReply.slice(mentionStart + 1 + mentionQuery.length);
    const inserted = `@${handle} `;
    const next = before + inserted + after;
    setNewReply(next);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    requestAnimationFrame(() => {
      const el = replyInputRef.current;
      if (el) {
        const pos = (before + inserted).length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const extractMentions = (text: string): Mention[] => {
    const handles = Array.from(text.matchAll(/@([\p{L}0-9_]+)/gu)).map((m) => m[1].toLowerCase());
    const seen = new Set<string>();
    const result: Mention[] = [];
    for (const h of handles) {
      if (seen.has(h)) continue;
      const u = tenantUsers.find((x) => slugifyMention(x.name) === h);
      if (u) { seen.add(h); result.push({ user_id: u.user_id, name: u.name }); }
    }
    return result;
  };

  const startReplyTo = (name: string | null | undefined) => {
    if (!name) return;
    const handle = slugifyMention(name);
    if (!handle) return;
    const prefix = `@${handle} `;
    setNewReply((cur) => (cur.startsWith(prefix) ? cur : prefix + cur));
    requestAnimationFrame(() => {
      const el = replyInputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  };

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    
    const { data: topicsData, error } = await supabase
      .from("topics")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("is_pinned", { ascending: false })
      .order("replies_count", { ascending: false })
      .limit(30);
    
    if (error) { console.error("Load topics error:", error); setLoading(false); return; }
    
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
    if (topicIdFromParams) {
      setLoadingMessages(true);
      setSelectedTopic(null);
      setMessages([]);
      
      console.log("Loading direct topic:", topicIdFromParams);
      
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
      
      const { data: msgs, error: msgError } = await supabase
        .from("topic_messages")
        .select("*")
        .eq("topic_id", topicIdFromParams)
        .order("created_at", { ascending: true });
      
      console.log("MESSAGES:", msgs, "error:", msgError);
      
      if (msgError) { 
        console.error("Load messages error:", msgError);
        setLoadingMessages(false);
        return; 
      }

      const rows = msgs || [];
      const userIds = Array.from(new Set(rows.map((m: any) => m.user_id).filter(Boolean)));
      let profilesMap = new Map<string, { name: string; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);
        (profs || []).forEach((p: any) => profilesMap.set(p.user_id, { name: p.name, avatar_url: p.avatar_url }));
      }

      setMessages(rows.map((m: any) => ({
        ...m,
        profiles: m.user_id ? profilesMap.get(m.user_id) ?? null : null,
      })));
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (tenant) loadTopics();
  }, [tenant]);

  useEffect(() => {
    loadDirectTopic();
  }, [topicIdFromParams]);

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
      .select("*")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    
    console.log("MESSAGES:", data, "error:", error);
    
    if (error) { 
      console.error("Load messages error:", error);
      setLoadingMessages(false);
      return; 
    }

    const rows = data || [];
    const userIds = Array.from(new Set(rows.map((m: any) => m.user_id).filter(Boolean)));
    let profilesMap = new Map<string, { name: string; avatar_url: string | null }>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);
      (profs || []).forEach((p: any) => profilesMap.set(p.user_id, { name: p.name, avatar_url: p.avatar_url }));
    }

    setMessages(rows.map((m: any) => ({
      ...m,
      profiles: m.user_id ? profilesMap.get(m.user_id) ?? null : null,
    })));
    setLoadingMessages(false);
  };

  const sendReply = async () => {
    if (!selectedTopic || !user || !newReply.trim()) return;
    setSendingReply(true);
    
    const content = newReply.trim();
    
    const { error: insertError } = await supabase.from("topic_messages").insert({
      topic_id: selectedTopic.id,
      user_id: user.id,
      content: content,
    });
    
    if (insertError) {
      console.error("Insert error:", insertError);
      setSendingReply(false);
      toast.error("Erro ao enviar");
      return;
    }
    
    await supabase.from("topics").update({
      last_activity_at: new Date().toISOString(),
    }).eq("id", selectedTopic.id);
    
    setSendingReply(false);
    setNewReply("");
    await loadTopicMessages(selectedTopic);
    loadTopics();
  };

  const closeTopic = () => {
    setSelectedTopic(null);
    setMessages([]);
    navigate("/conversas");
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
                    <p className="text-xs text-gray-400">{formatTime(topic.last_activity_at)}</p>
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
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Reply Input */}
          {selectedTopic && !selectedTopic.is_locked && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                />
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

      <BottomNav />
    </div>
  );
}