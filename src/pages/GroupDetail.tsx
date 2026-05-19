import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Users, UserPlus, UserMinus, Send, Pin, PinOff, Trash2, MessageCircle, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { AddMembersModal } from "@/components/groups/AddMembersModal";
import { useGroupMembers } from "@/hooks/groups/useGroupMembers";
import { groupsService, GroupPost, GroupReply, GroupSystemMessage } from "@/services/groupsService";

type GroupMember = {
  id: string;
  user_id: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  };
};

type Group = {
  id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
};

type FeedItem = 
  | { type: "post"; data: GroupPost }
  | { type: "system"; data: GroupSystemMessage };

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupLoaded, setGroupLoaded] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [replyingTo, setReplyingTo] = useState<GroupPost | null>(null);
  const [replies, setReplies] = useState<Record<string, GroupReply[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<Record<string, boolean>>({});
  const [newReply, setNewReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const feedEndRef = useRef<HTMLDivElement>(null);

  const {
    searchResults,
    searching,
    addMember,
    searchMembers,
    clearSearch,
  } = useGroupMembers();

  useEffect(() => {
    if (!user || !tenant || !groupId) {
      navigate("/");
      return;
    }
    loadGroup();
  }, [user, tenant, groupId, navigate]);

  useEffect(() => {
    if (!groupLoaded || !members.length || !user) return;
    const isMember = members.some(m => m.user_id === user.id);
    if (!isMember) {
      toast.error("Você não é membro deste grupo");
      navigate("/groups");
    }
  }, [groupLoaded, members, user, navigate]);

  const loadGroup = async () => {
    if (!groupId) return;
    setLoading(true);

    const result = await groupsService.getGroup(groupId);
    if (result.error || !result.data) {
      setLoading(false);
      toast.error("Grupo não encontrado");
      navigate("/groups");
      return;
    }
    setGroup(result.data);

    const membersResult = await groupsService.getMembers(groupId);
    if (membersResult.error) {
      toast.error("Erro ao carregar membros: " + membersResult.error);
    } else {
      setMembers(membersResult.data);
    }

    await loadFeed();
    setLoading(false);
    setGroupLoaded(true);
  };

  const loadFeed = async () => {
    if (!groupId) return;
    setFeedLoading(true);

    const [postsResult, systemResult] = await Promise.all([
      groupsService.getPosts(groupId),
      groupsService.getSystemMessages(groupId),
    ]);

    const items: FeedItem[] = [];

    if (!postsResult.error && postsResult.data) {
      postsResult.data.forEach(post => {
        items.push({ type: "post", data: post });
      });
    }

    if (!systemResult.error && systemResult.data) {
      systemResult.data.forEach(msg => {
        items.push({ type: "system", data: msg });
      });
    }

    items.sort((a, b) => {
      const dateA = a.type === "post" ? a.data.created_at : a.data.created_at;
      const dateB = b.type === "post" ? b.data.created_at : b.data.created_at;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    setFeedItems(items);
    setFeedLoading(false);

    setTimeout(() => {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !groupId || !group) return;
    setSendingMessage(true);

    const result = await groupsService.createPost(groupId, user.id, newMessage.trim());
    
    if (result.error) {
      toast.error("Erro ao enviar mensagem");
      setSendingMessage(false);
      return;
    }

    if (result.data) {
      setFeedItems(prev => [...prev, { type: "post", data: result.data! }]);
      setNewMessage("");
      
      if (tenant?.id) {
        await groupsService.createActivityNotification(
          tenant.id,
          groupId,
          group.name,
          user.name || "Usuário"
        );
      }
    }

    setSendingMessage(false);
    
    setTimeout(() => {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleOpenReplies = async (post: GroupPost) => {
    if (replies[post.id]) {
      setReplyingTo(post);
      return;
    }

    setRepliesLoading(prev => ({ ...prev, [post.id]: true }));
    setReplyingTo(post);

    const result = await groupsService.getReplies(post.id);
    if (!result.error && result.data) {
      setReplies(prev => ({ ...prev, [post.id]: result.data }));
    }

    setRepliesLoading(prev => ({ ...prev, [post.id]: false }));
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !user || !replyingTo) return;
    setSendingReply(true);

    const result = await groupsService.createReply(replyingTo.id, user.id, newReply.trim());
    
    if (result.error) {
      toast.error("Erro ao enviar resposta");
      setSendingReply(false);
      return;
    }

    if (result.data) {
      setReplies(prev => ({
        ...prev,
        [replyingTo.id]: [...(prev[replyingTo.id] || []), result.data!],
      }));
      setNewReply("");
    }

    setSendingReply(false);
  };

  const handleDeletePost = async (postId: string) => {
    const result = await groupsService.deletePost(postId);
    if (result.error) {
      toast.error("Erro ao excluir mensagem");
      return;
    }
    setFeedItems(prev => prev.filter(item => item.type !== "post" || item.data.id !== postId));
    toast.success("Mensagem excluída");
  };

  const handleTogglePin = async (post: GroupPost) => {
    const result = await groupsService.togglePinPost(post.id, post.is_pinned);
    if (result.error) {
      toast.error("Erro ao fixar mensagem");
      return;
    }
    setFeedItems(prev => prev.map(item => {
      if (item.type === "post" && item.data.id === post.id) {
        return { type: "post", data: { ...item.data, is_pinned: !post.is_pinned } };
      }
      return item;
    }));
    toast.success(post.is_pinned ? "Mensagem desafixada" : "Mensagem fixada");
  };

  const handleAddMember = async (userId: string) => {
    if (!groupId || !user || !group) return;
    const result = await addMember(groupId, userId, user.id);
    if (!result.success) {
      toast.error(result.error || "Erro ao adicionar membro");
    } else {
      toast.success("Membro adicionado!");
      setShowAddMembers(false);
      clearSearch();
      
      const membersRes = await groupsService.getMembers(groupId);
      if (!membersRes.error) setMembers(membersRes.data);

      const memberInfo = membersRes.data?.find(m => m.user_id === userId);
      if (memberInfo?.profiles?.name) {
        await groupsService.createSystemMessage(groupId, "member_joined", memberInfo.profiles.name);
        await loadFeed();
      }
    }
  };

  const handleSearchMembers = (query: string) => {
    if (!tenant?.id || !groupId) return;
    searchMembers(tenant.id, groupId, query);
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string, memberName: string | null) => {
    if (!groupId) return;
    setRemovingId(memberId);

    const result = await groupsService.removeMember(memberId);

    setRemovingId(null);

    if (result.error) {
      toast.error("Erro ao remover membro");
    } else {
      toast.success("Membro removido");
      setMembers(prev => prev.filter(m => m.id !== memberId));
      await groupsService.createSystemMessage(groupId, "member_left", memberName || "Membro");
      await loadFeed();
    }
  };

  const isGroupOwner = group?.created_by === user?.id;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/groups")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{group?.name}</h1>
            <p className="text-xs text-muted-foreground">
              {group?.type === "private" ? "Privado" : "Interno"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            • {members.map(m => m.profiles?.name?.split(" ")[0] || "?").join(" • ")}
          </span>
          {isGroupOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddMembers(true)}
              className="ml-auto"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>

        <div className="border-t border-border pt-4">
          {feedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-muted-foreground text-sm mt-1">Seja o primeiro a enviar uma mensagem</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item, idx) => {
                if (item.type === "system") {
                  const msg = item.data;
                  let text = "";
                  if (msg.message_type === "group_created") {
                    text = `${msg.user_name} criou o grupo`;
                  } else if (msg.message_type === "member_joined") {
                    text = `${msg.user_name} entrou no grupo`;
                  } else if (msg.message_type === "member_left") {
                    text = `${msg.user_name} saiu do grupo`;
                  }
                  return (
                    <div key={msg.id || idx} className="flex items-center justify-center">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {text}
                      </span>
                    </div>
                  );
                }

                const post = item.data;
                const isPinned = post.is_pinned;
                const isAuthor = post.author_id === user?.id;
                const postReplies = replies[post.id] || [];

                return (
                  <div key={post.id} className={`p-3 rounded-xl border ${isPinned ? "border-brand/30 bg-brand/5" : "bg-card"}`}>
                    {isPinned && (
                      <div className="text-xs text-brand font-medium mb-2 flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Mensagem fixada
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                        {post.profiles?.avatar_url ? (
                          <img src={post.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {post.profiles?.name?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{post.profiles?.name || "Usuário"}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleOpenReplies(post)}
                            className="text-xs text-muted-foreground hover:text-brand flex items-center gap-1"
                          >
                            <CornerDownRight className="h-3 w-3" />
                            Responder
                            {postReplies.length > 0 && ` (${postReplies.length})`}
                          </button>
                          {isGroupOwner && (
                            <>
                              <button
                                onClick={() => handleTogglePin(post)}
                                className="text-xs text-muted-foreground hover:text-brand"
                              >
                                {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-xs text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>

                        {replyingTo?.id === post.id && (
                          <div className="mt-3 pl-4 border-l-2 border-border space-y-2">
                            {repliesLoading[post.id] ? (
                              <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : postReplies.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Nenhuma resposta ainda</p>
                            ) : (
                              postReplies.map(reply => (
                                <div key={reply.id} className="bg-muted/50 rounded-lg p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{reply.profiles?.name || "Usuário"}</span>
                                    <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm mt-1">{reply.content}</p>
                                </div>
                              ))
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                placeholder="Escrever resposta..."
                                className="h-8 text-sm"
                                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                              />
                              <Button
                                size="sm"
                                onClick={handleSendReply}
                                disabled={sendingReply || !newReply.trim()}
                                className="h-8"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={feedEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-3">
        <div className="flex gap-2 items-center">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escrever mensagem..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="bg-brand text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomNav />

      <AddMembersModal
        open={showAddMembers}
        onClose={() => {
          setShowAddMembers(false);
          clearSearch();
        }}
        tenantId={tenant?.id || ""}
        groupId={groupId || ""}
        onAddMember={handleAddMember}
        onSearch={handleSearchMembers}
        onClearSearch={clearSearch}
        searchResults={searchResults}
        searching={searching}
        membersCount={members.length}
      />
    </div>
  );
}