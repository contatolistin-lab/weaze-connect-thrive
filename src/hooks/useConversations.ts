import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as conv from "@/lib/conversations";
import { subscribeToConversation, unsubscribeAll } from "@/lib/conversationRealtime";
import type { Conversation, ConversationMessage, ConversationMember, ConversationRole, ConversationVisibility } from "@/lib/conversations";

export function useConversations(tenantId: string, userId: string) {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["conversations", tenantId, userId],
    queryFn: () => conv.getMyConversationsWithRole(tenantId, userId),
    enabled: !!tenantId && !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (params: { title: string; description?: string; visibility: ConversationVisibility }) =>
      conv.createConversation({ tenantId, title: params.title, description: params.description, visibility: params.visibility, createdBy: userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", tenantId, userId] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => conv.archiveConversation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", tenantId, userId] }),
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createConversation: createMutation.mutate,
    isCreating: createMutation.isPending,
    archiveConversation: archiveMutation.mutate,
  };
}

export function useConversation(id: string | null, userId: string) {
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (messagesQuery.data) setMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (pinnedQuery.data) setPinned(pinnedQuery.data);
  }, [pinnedQuery.data]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToConversation(id, (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) {
          return prev.map((m) => (m.id === msg.id ? msg : m));
        }
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    });
    return () => {
      unsub();
      unsubscribeAll();
    };
  }, [id, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (params: { content: string; replyTo?: string | null }) =>
      conv.sendMessage({ conversationId: id!, userId, content: params.content, replyTo: params.replyTo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] }),
  });

  const updateMessageMutation = useMutation({
    mutationFn: (params: { messageId: string; content: string }) =>
      conv.updateMessage(params.messageId, params.content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] }),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => conv.softDeleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] }),
  });

  const pinMessageMutation = useMutation({
    mutationFn: (messageId: string) =>
      conv.pinMessage({ messageId, conversationId: id!, pinnedBy: userId }),
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
    mutationFn: (params: { userId: string; role: ConversationRole }) =>
      conv.addConversationMember({ conversationId: id!, ...params, addedBy: userId }),
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
