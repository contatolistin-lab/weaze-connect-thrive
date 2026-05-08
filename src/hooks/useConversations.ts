import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as conv from "@/lib/conversations";
import type { Conversation, ConversationMessage, ConversationMember, ConversationRole, ConversationVisibility } from "@/lib/conversations";

let conversationsListChannel: ReturnType<typeof supabase.channel> | null = null;
const convListListeners = new Set<() => void>();

function getOrCreateConversationsListChannel() {
  if (conversationsListChannel) return conversationsListChannel;

  conversationsListChannel = supabase
    .channel("conversations-list-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "conversations" },
      () => {
        console.log("[Realtime] New conversation inserted");
        convListListeners.forEach((l) => l());
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "conversations" },
      () => {
        console.log("[Realtime] Conversation updated");
        convListListeners.forEach((l) => l());
      }
    )
    .subscribe();

  return conversationsListChannel;
}

export function useConversations(tenantId: string, userId: string) {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["conversations", tenantId, userId],
    queryFn: () => conv.getMyConversationsWithRole(tenantId, userId),
    enabled: !!tenantId && !!userId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!tenantId || !userId) return;

    getOrCreateConversationsListChannel();
    const listener = () => {
      console.log("[useConversations] Invalidating conversations cache");
      queryClient.invalidateQueries({ queryKey: ["conversations", tenantId, userId] });
    };
    convListListeners.add(listener);

    return () => {
      convListListeners.delete(listener);
    };
  }, [tenantId, userId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async (params: { title: string; description?: string; visibility: ConversationVisibility }) => {
      console.log("[useConversations] Creating conversation - START:", Date.now(), params);
      const result = await conv.createConversation({ tenantId, title: params.title, description: params.description, visibility: params.visibility, createdBy: userId });
      console.log("[useConversations] Creating conversation - END:", Date.now(), result);
      return result;
    },
    onSuccess: () => {
      console.log("[useConversations] onSuccess - invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["conversations", tenantId] });
    },
    onError: (error) => {
      console.error("[useConversations] onError:", error);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => conv.archiveConversation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", tenantId, userId] }),
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    refetch: conversationsQuery.refetch,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    archiveConversation: archiveMutation.mutate,
  };
}

export function useConversation(id: string | null, userId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const listenersRef = useRef<Set<(msg: ConversationMessage) => void>>(new Set());

  const conversationQuery = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => (id ? conv.getConversation(id) : null),
    enabled: !!id,
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", id],
    queryFn: () => (id ? conv.getConversationMessages(id, 100, 0) : []),
    enabled: !!id,
  });

  const pinnedQuery = useQuery({
    queryKey: ["conversation-pinned", id],
    queryFn: () => (id ? conv.getPinnedMessages(id) : []),
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: ["conversation-members", id],
    queryFn: () => (id ? conv.getConversationMembers(id) : []),
    enabled: !!id,
  });

  const roleQuery = useQuery({
    queryKey: ["conversation-role", id, userId],
    queryFn: () => (id && userId ? conv.getMyRole(id, userId) : null),
    enabled: !!id && !!userId,
  });

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [pinned, setPinned] = useState<ConversationMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (messagesQuery.data !== undefined) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (pinnedQuery.data !== undefined) {
      setPinned(pinnedQuery.data);
    }
  }, [pinnedQuery.data]);

  useEffect(() => {
    if (!id) {
      setMessages([]);
      setPinned([]);
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      listenersRef.current.clear();
    }

    const handleRealtimeMessage = (msg: ConversationMessage) => {
      console.log("[useConversation] Realtime message received:", msg.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.map((m) => (m.id === msg.id ? msg : m));
        }
        return [...prev, msg];
      });
    };

    listenersRef.current.add(handleRealtimeMessage);

    channelRef.current = supabase
      .channel(`conv-msgs-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const msg = payload.new as ConversationMessage;
          if (msg.deleted === false) {
            console.log("[useConversation] New message via realtime:", msg.id);
            listenersRef.current.forEach((l) => l(msg));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const msg = payload.new as ConversationMessage;
          if (msg.deleted === false) {
            console.log("[useConversation] Updated message via realtime:", msg.id);
            listenersRef.current.forEach((l) => l(msg));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        listenersRef.current.clear();
      }
    };
  }, [id]);

  const loadMore = useCallback(async () => {
    if (!id || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const newOffset = messages.length;
    const newMessages = await conv.getConversationMessages(id, 50, newOffset);
    if (newMessages.length < 50) setHasMore(false);
    setMessages((prev) => [...prev, ...newMessages]);
    setLoadingMore(false);
  }, [id, hasMore, loadingMore, messages.length]);

  const sendMessageMutation = useMutation({
    mutationFn: (params: { content: string; replyTo?: string | null }) => {
      if (!id) throw new Error("No conversation selected");
      return conv.sendMessage({ conversationId: id, userId, content: params.content, replyTo: params.replyTo });
    },
    onSuccess: (data) => {
      console.log("[useConversation] Message sent:", data.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    },
    onError: (error) => {
      console.error("[useConversation] Failed to send message:", error);
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: (params: { messageId: string; content: string }) =>
      conv.updateMessage(params.messageId, params.content),
    onSuccess: (data) => {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => conv.softDeleteMessage(messageId),
    onSuccess: (_, messageId) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, content: "[mensagem removida]" } : m))
      );
    },
  });

  const pinMessageMutation = useMutation({
    mutationFn: (messageId: string) => {
      if (!id) throw new Error("No conversation selected");
      return conv.pinMessage({ messageId, conversationId: id, pinnedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversation-pinned", id] });
    },
  });

  const unpinMessageMutation = useMutation({
    mutationFn: (messageId: string) => conv.unpinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversation-pinned", id] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (params: { userId: string; role: ConversationRole }) => {
      if (!id) throw new Error("No conversation selected");
      return conv.addConversationMember({ conversationId: id, ...params, addedBy: userId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-members", id] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => conv.removeConversationMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-members", id] }),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: (params: { memberId: string; role: ConversationRole }) =>
      conv.updateMemberRole(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-members", id] }),
  });

  return {
    conversation: conversationQuery.data,
    messages,
    pinned,
    members: membersQuery.data ?? [],
    myRole: roleQuery.data,
    isLoadingConversation: conversationQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingMembers: membersQuery.isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    updateMessage: updateMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    pinMessage: pinMessageMutation.mutate,
    isPinning: pinMessageMutation.isPending,
    unpinMessage: unpinMessageMutation.mutate,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    loadMore,
    hasMore,
    loadingMore,
  };
}

export function useSearchMembers(conversationId: string | null) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchMembers = useCallback(async (q: string) => {
    if (!q.trim() || !conversationId) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .ilike("name", `%${q}%`)
      .limit(10);
    setResults(data ?? []);
    setSearching(false);
  }, [conversationId]);

  useEffect(() => {
    const timer = setTimeout(() => searchMembers(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchMembers]);

  return { search, setSearch, results, searching };
}
