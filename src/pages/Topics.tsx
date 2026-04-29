import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageCircle, Pin, Clock, TrendingUp, Plus, ArrowLeft, Heart, Reply, Trash2, Send, Users, ExternalLink, Image } from "lucide-react";

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
  posts?: { media_url: string | null } | null;
};

type TopicMessage = {
  id: string;
  topic_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
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
  const { tenant, canManage } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get("post");
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "pinned">("trending");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    
    let query = supabase
      .from("topics")
      .select("*, profiles:profiles!topics_created_by_fkey(name, avatar_url), posts:posts!topics_related_post_id_fkey(media_url)")
      .eq("tenant_id", tenant.id);
    
    if (postId) {
      query = query.eq("related_post_id", postId);
    }
    
    if (activeTab === "pinned") {
      query = query.eq("is_pinned", true).order("created_at", { ascending: false });
    } else if (activeTab === "trending") {
      query = query.order("replies_count", { ascending: false });
    } else {
      query = query.order("last_activity_at", { ascending: false });
    }
    
    const { data, error } = await query.limit(30);
    setLoading(false);
    
    if (error) { console.error("Load topics error:", error); return; }
    setTopics(data || []);
  };

  useEffect(() => {
    if (tenant) loadTopics();
  }, [tenant, activeTab, postId]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const createTopic = async () => {
    if (!tenant || !user || !newTitle.trim()) return;
    setCreating(true);
    
    const { error } = await supabase.from("topics").insert({
      tenant_id: tenant.id,
      related_post_id: postId,
      title: newTitle.trim(),
      created_by: user.id,
    });
    
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    
    toast.success("Tópico criado!");
    setShowCreate(false);
    setNewTitle("");
    loadTopics();
  };

  const loadTopicMessages = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingMessages(true);
    setNewReply("");
    
    const { data, error } = await supabase
      .from("topic_messages")
      .select("*, profiles:profiles!topic_messages_user_id_fkey(name, avatar_url)")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    
    setLoadingMessages(false);
    if (error) { console.error("Load messages error:", error); return; }
    setMessages(data || []);
  };

  const sendReply = async () => {
    if (!selectedTopic || !user || !newReply.trim()) return;
    setSendingReply(true);
    
    const { error } = await supabase.from("topic_messages").insert({
      topic_id: selectedTopic.id,
      user_id: user.id,
      content: newReply.trim(),
    });
    
    setSendingReply(false);
    if (error) { toast.error(error.message); return; }
    
    setNewReply("");
    await loadTopicMessages(selectedTopic);
    loadTopics();
  };

  const likeMessage = async (msgId: string) => {
    if (likedMessages.has(msgId)) return;
    
    setLikedMessages(prev => new Set(prev).add(msgId));
    
    await supabase.rpc("increment_likes", { message_id: msgId });
  };

  const deleteTopic = async (topicId: string) => {
    if (!confirm("Excluir tópico?")) return;
    
    const { error } = await supabase.from("topics").delete().eq("id", topicId);
    if (error) { toast.error(error.message); return; }
    
    toast.success("Tópico excluído");
    loadTopics();
  };

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6">
          <p className="text-muted-foreground">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-display text-2xl mb-1">Conversas</h1>
        <p className="text-sm text-muted-foreground">Participe das discussões da comunidade</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-2">
        <button
          onClick={() => setActiveTab("trending")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "trending" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <TrendingUp className="h-4 w-4 inline mr-1" />
          Em alta
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "recent" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Clock className="h-4 w-4 inline mr-1" />
          Recentes
        </button>
        <button
          onClick={() => setActiveTab("pinned")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "pinned" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Pin className="h-4 w-4 inline mr-1" />
          Fixados
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="font-medium text-lg mb-2">Seja o primeiro a iniciar uma conversa</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Comente em um post para começar uma discussão
            </p>
            {isB2B && (
              <Button onClick={() => setShowCreate(true)} className="bg-brand">
                <Plus className="h-4 w-4 mr-2" />
                Criar conversa
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => loadTopicMessages(topic)}
              >
                {topic.is_pinned && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
                    <Pin className="h-3 w-3" />
                    <span className="font-medium">Fixado</span>
                  </div>
                )}
                
                {topic.related_post_id && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <ExternalLink className="h-3 w-3" />
                    <span>Baseado em um post</span>
                  </div>
                )}
                
                <h3 className="font-medium mb-3 line-clamp-2">{topic.title}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {topic.replies_count} respostas
                    </span>
                    <span>•</span>
                    <span>{formatTime(topic.last_activity_at)}</span>
                  </div>
                  
                  {topic.profiles && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={topic.profiles.avatar_url ?? ""} />
                      <AvatarFallback className="text-xs">
                        {topic.profiles.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Button - only for B2B */}
      {isB2B && topics.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:hidden">
          <Button 
            onClick={() => setShowCreate(true)} 
            className="w-full bg-brand h-12 text-base shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova conversa
          </Button>
        </div>
      )}

      {/* Create Topic Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Sobre o que você quer conversar?"
              rows={4}
              className="resize-none"
            />
            <Button 
              onClick={createTopic} 
              disabled={creating || !newTitle.trim()} 
              className="w-full bg-brand"
            >
              {creating ? "Criando..." : "Iniciar conversa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Messages View */}
      <Dialog open={!!selectedTopic} onOpenChange={(open) => { if (!open) setSelectedTopic(null); }}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <button 
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <DialogTitle className="text-left pr-8">{selectedTopic?.title}</DialogTitle>
            {selectedTopic?.related_post_id && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Discussão baseada em um post</span>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 px-1">
            {loadingMessages ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground">Seja o primeiro a responder!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "bg-muted rounded-2xl p-4",
                    msg.parent_id && "ml-8 border-l-2 border-border"
                  )}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={msg.profiles?.avatar_url ?? ""} />
                      <AvatarFallback>
                        {msg.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.profiles?.name || "Usuário"}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); likeMessage(msg.id); }}
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            likedMessages.has(msg.id) ? "text-red-500" : "text-muted-foreground"
                          )}
                        >
                          <Heart className={cn("h-3.5 w-3.5", likedMessages.has(msg.id) && "fill-current")} />
                          {msg.likes_count}
                        </button>
                        {selectedTopic && !selectedTopic.is_locked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNewReply(`@${msg.profiles?.name} `); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            Responder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedTopic && !selectedTopic.is_locked && (
            <div className="flex-shrink-0 pt-4 mt-2 border-t">
              <div className="flex gap-2">
                <Input
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                />
                <Button 
                  onClick={sendReply} 
                  disabled={sendingReply || !newReply.trim()}
                  size="icon"
                  className="bg-brand"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}