import { supabase } from "@/integrations/supabase/client";

export type ConversationVisibility = "public" | "private" | "internal";
export type ConversationRole = "owner" | "moderator" | "member";

export type Conversation = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  visibility: ConversationVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  max_pins: number;
  member_count?: number;
  my_role?: ConversationRole | null;
};

export type ConversationMember = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationRole;
  added_by: string | null;
  created_at: string;
  profiles?: { name: string | null; avatar_url: string | null } | null;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  reply_to: string | null;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  profiles?: { name: string | null; avatar_url: string | null } | null;
  reply_preview?: { content: string; profiles: { name: string | null } | null } | null;
};

export type PinnedMessage = {
  id: string;
  conversation_id: string;
  message_id: string;
  pinned_by: string | null;
  created_at: string;
  message?: ConversationMessage;
};

export async function getConversations(tenantId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_members!inner(user_id, role)
    `)
    .eq("tenant_id", tenantId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Conversation;
}

export async function createConversation(params: {
  tenantId: string;
  title: string;
  description?: string;
  visibility: ConversationVisibility;
  createdBy: string;
}): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      tenant_id: params.tenantId,
      title: params.title,
      description: params.description ?? null,
      visibility: params.visibility,
      created_by: params.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function updateConversation(id: string, params: {
  title?: string;
  description?: string;
  visibility?: ConversationVisibility;
  archived?: boolean;
}): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function archiveConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("*, profiles(name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function addConversationMember(params: {
  conversationId: string;
  userId: string;
  role: ConversationRole;
  addedBy: string;
}): Promise<ConversationMember> {
  const { data, error } = await supabase
    .from("conversation_members")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      added_by: params.addedBy,
    })
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) throw error;
  return data as ConversationMember;
}

export async function updateMemberRole(params: {
  memberId: string;
  role: ConversationRole;
}): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .update({ role: params.role })
    .eq("id", params.memberId);

  if (error) throw error;
}

export async function removeConversationMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

export async function getMyRole(conversationId: string, userId: string): Promise<ConversationRole | null> {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as ConversationRole;
}

export async function getMyConversationsWithRole(tenantId: string, userId: string): Promise<Array<Conversation & { my_role: ConversationRole | null }>> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_members!inner(user_id, role)
    `)
    .eq("tenant_id", tenantId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) return [];

  return (data as any[]).map((c) => {
    const myMembership = c.conversation_members?.find((m: any) => m.user_id === userId);
    return { ...c, my_role: myMembership?.role ?? null };
  });
}

export async function getConversationMessages(conversationId: string, limit = 50, offset = 0): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select(`
      *,
      profiles(name, avatar_url),
      reply_to(content, profiles(name))
    `)
    .eq("conversation_id", conversationId)
    .eq("deleted", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function getPinnedMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select(`*, profiles(name, avatar_url)`)
    .eq("conversation_id", conversationId)
    .eq("pinned", true)
    .eq("deleted", false)
    .order("pinned_at", { ascending: true });

  if (error) return [];
  return (data as any[]) ?? [];
}

export async function sendMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  replyTo?: string | null;
}): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      content: params.content,
      reply_to: params.replyTo ?? null,
    })
    .select(`*, profiles(name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as ConversationMessage;
}

export async function updateMessage(messageId: string, content: string): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .select(`*, profiles(name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as ConversationMessage;
}

export async function softDeleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_messages")
    .update({ deleted: true, content: "[mensagem removida]" })
    .eq("id", messageId);

  if (error) throw error;
}

export async function pinMessage(params: {
  messageId: string;
  conversationId: string;
  pinnedBy: string;
}): Promise<{ success: boolean; error?: string }> {
  const pinnedCount = await supabase
    .from("conversation_messages")
    .select("id", { count: "exact" })
    .eq("conversation_id", params.conversationId)
    .eq("pinned", true);

  if ((pinnedCount.count ?? 0) >= 3) {
    return { success: false, error: "Limite de 3 mensagens fixadas atingido. Remova uma antes de fixar outra." };
  }

  const { error } = await supabase
    .from("conversation_messages")
    .update({
      pinned: true,
      pinned_at: new Date().toISOString(),
      pinned_by: params.pinnedBy,
    })
    .eq("id", params.messageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function unpinMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_messages")
    .update({ pinned: false, pinned_at: null, pinned_by: null })
    .eq("id", messageId);

  if (error) throw error;
}

export async function canPinInConversation(conversationId: string): Promise<boolean> {
  const pinnedCount = await supabase
    .from("conversation_messages")
    .select("id", { count: "exact" })
    .eq("conversation_id", conversationId)
    .eq("pinned", true);

  return (pinnedCount.count ?? 0) < 3;
}
