import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageCircle, Pin, Clock, TrendingUp, Plus, ArrowLeft, Heart, Reply, Trash2 } from "lucide-react";

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

export default function Topics() {
  const { tenant } = useTenant();
  const { user } = useAuth();
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

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    
    let query = supabase
      .from("topics")
      .select("*, profiles:profiles!topics_created_by_fkey(name, avatar_url)")
      .eq("tenant_id", tenant.id);
    
    if (postId) {
      query = query.eq("related_post_id", postId);
    }
    
    if (activeTab === "pinned") {
      query = query.eq("is_pinned", true);
    } else {
      query = query.order(activeTab === "trending" ? "replies_count" : "last_activity_at", { ascending: false });
    }
    
    const { data, error } = await query.limit(20);
    setLoading(false);
    
    if (error) { console.error("Load topics error:", error); return; }
    setTopics(data || []);
  };

  useEffect(() => {
    if (tenant) loadTopics();
  }, [tenant, activeTab, postId]);

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
    loadTopicMessages(selectedTopic);
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
      
      {/* Tabs */}
      <div className="flex border-b border-border">
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

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : topics.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">Nenhum tópico ainda.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar tópico
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => loadTopicMessages(topic)}
              >
                {topic.is_pinned && (
                  <span className="inline-flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mb-2">
                    <Pin className="h-3 w-3 mr-1" /> Fixado
                  </span>
                )}
                <h3 className="font-medium mb-2">{topic.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{topic.replies_count} respostas</span>
                  <span>•</span>
                  <span>{new Date(topic.last_activity_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="p-4 border-t border-border">
        <Button onClick={() => setShowCreate(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Novo tópico
        </Button>
      </div>

      {/* Create Topic Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo tópico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do tópico..."
              rows={3}
            />
            <Button onClick={createTopic} disabled={creating || !newTitle.trim()} className="w-full">
              {creating ? "Criando..." : "Criar tópico"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Messages Dialog */}
      <Dialog open={!!selectedTopic} onOpenChange={(open) => { if (!open) setSelectedTopic(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTopic?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {loadingMessages ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Seja o primeiro a responder!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 p-3 bg-gray-100 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.profiles?.avatar_url ?? ""} />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.profiles?.name || "Usuário"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => likeMessage(msg.id)}
                        className={`flex items-center gap-1 text-xs ${likedMessages.has(msg.id) ? "text-red-500" : "text-muted-foreground"}`}
                      >
                        <Heart className={cn("h-3 w-3", likedMessages.has(msg.id) && "fill-current")} />
                        {msg.likes_count}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedTopic && !selectedTopic.is_locked && (
            <div className="flex gap-2 pt-4 border-t">
              <Input
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Responder..."
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
              />
              <Button onClick={sendReply} disabled={sendingReply || !newReply.trim()}>
                <Reply className="h-4 w-4" />
              </Button>
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