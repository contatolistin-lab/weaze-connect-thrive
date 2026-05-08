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
  conversation_members?: Array<{ user_id: string; role: ConversationRole }>;
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

export async function getConversations(tenantId: string): Promise<Conversation[]> {
  if (!tenantId) {
    console.warn("[getConversations] Missing tenantId, skipping");
    return [];
  }
  const { data, error } = await supabase
    .from("conversations")
    .select("*, conversation_members(user_id, role)")
    .eq("tenant_id", tenantId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getConversations] Error:", error);
    throw error;
  }
  console.log("[getConversations] Fetched", data?.length ?? 0, "conversations for tenant", tenantId);
  return (data as any[]) ?? [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  if (!id) {
    console.warn("[getConversation] Missing id");
    return null;
  }
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getConversation] Error fetching conversation", id, error);
    return null;
  }
  console.log("[getConversation] Fetched conversation", id, data?.title);
  return data as Conversation;
}

export async function createConversation(params: {
  tenantId: string;
  title: string;
  description?: string;
  visibility: ConversationVisibility;
  createdBy: string;
}): Promise<Conversation> {
  console.log("[createConversation] Starting RPC call:", params.tenantId, params.title, params.visibility);

  if (!params.tenantId || !params.createdBy || !params.title) {
    throw new Error("Missing required fields");
  }

  const { data: conv, error: rpcError } = await supabase.rpc("create_conversation", {
    p_tenant_id: params.tenantId,
    p_title: params.title.trim(),
    p_description: params.description?.trim() || null,
    p_visibility: params.visibility,
    p_created_by: params.createdBy,
  });

  if (rpcError) {
    console.error("[createConversation] RPC failed:", rpcError);
    // Check for duplicate key error and provide clear message
    if (rpcError.code === "23505" || rpcError.message?.includes("duplicate")) {
      throw new Error("Já existe uma conversa com esse nome neste comunidade");
    }
    throw rpcError;
  }

  console.log("[createConversation] RPC succeeded:", JSON.stringify(conv));

  if (!conv) {
    throw new Error("create_conversation returned empty result");
  }

  const conversation = conv as Conversation;
  console.log("[createConversation] Returning conversation:", conversation.id, conversation.title);
  return { ...conversation, my_role: "owner" };
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

  if (error) {
    console.error("[getConversationMembers] Error:", error);
    throw error;
  }
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

export async function getMyConversationsWithRole(tenantId: string, userId: string): Promise<Conversation[]> {
  console.log("[getMyConversationsWithRole] START - tenantId:", tenantId, "userId:", userId);
  
  if (!tenantId) {
    console.warn("[getMyConversationsWithRole] Missing tenantId - returning empty");
    return [];
  }
  if (!userId) {
    console.warn("[getMyConversationsWithRole] Missing userId - returning empty");
    return [];
  }

  console.log("[getMyConversationsWithRole] Executing Supabase query for tenant:", tenantId);
  
  // Primeiro: buscar TODAS as conversas do tenant (sem filtro de archived)
  const { data: allConvs, error: allError } = await supabase
    .from("conversations")
    .select("id, title, tenant_id, archived")
    .eq("tenant_id", tenantId);
  
  console.log("[getMyConversationsWithRole] ALL conversations in tenant (no RLS):", allConvs?.length ?? 0, allConvs);
  
  // Segundo: buscar TODAS as conversas (sem filtro archived)
  const { data, error } = await supabase
    .from("conversations")
    .select("*, conversation_members(user_id, role)")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  console.log("[getMyConversationsWithRole] Query result - data:", data?.length ?? 0, "error:", error);

  if (error) {
    console.error("[getMyConversationsWithRole] Error:", error);
    return [];
  }

  console.log("[getMyConversationsWithRole] Got", data?.length ?? 0, "conversations for tenant", tenantId, "user", userId);
  if (data?.length === 0) {
    const { data: rawData, error: rawError } = await supabase
      .from("conversations")
      .select("id, title, visibility, tenant_id, archived")
      .eq("tenant_id", tenantId);
    console.log("[getMyConversationsWithRole] Raw query (no RLS check):", rawData?.length ?? 0, "rows. Error:", rawError);
    if (rawData && rawData.length > 0) {
      console.log("[getMyConversationsWithRole] RLS is blocking visibility! Conversations:", rawData);
    }
  }

  return (data as any[]).map((c) => {
    const myMembership = c.conversation_members?.find((m: any) => m.user_id === userId);
    return { ...c, my_role: myMembership?.role ?? null };
  });
}

export async function getConversationMessages(conversationId: string, limit = 100, offset = 0): Promise<ConversationMessage[]> {
  if (!conversationId) {
    console.warn("[getConversationMessages] Missing conversationId");
    return [];
  }
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*, profiles(name, avatar_url), reply_to(content, profiles(name))")
    .eq("conversation_id", conversationId)
    .eq("deleted", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[getConversationMessages] Error:", error);
    throw error;
  }
  console.log("[getConversationMessages] Got", data?.length ?? 0, "messages for conversation", conversationId);
  return (data as any[]) ?? [];
}

export async function getPinnedMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*, profiles(name, avatar_url)")
    .eq("conversation_id", conversationId)
    .eq("pinned", true)
    .eq("deleted", false)
    .order("pinned_at", { ascending: true });

  if (error) {
    console.error("[getPinnedMessages] Error:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

export async function sendMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  replyTo?: string | null;
}): Promise<ConversationMessage> {
  console.log("[sendMessage] Sending message to conversation", params.conversationId);

  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      content: params.content,
      reply_to: params.replyTo ?? null,
    })
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) {
    console.error("[sendMessage] Error:", error);
    throw error;
  }

  console.log("[sendMessage] Message sent:", data.id);
  return data as ConversationMessage;
}

export async function updateMessage(messageId: string, content: string): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("*, profiles(name, avatar_url)")
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
}): Promise<void> {
  const { error } = await supabase
    .from("conversation_message_pins")
    .insert({
      conversation_id: params.conversationId,
      message_id: params.messageId,
      pinned_by: params.pinnedBy,
    });

  if (error) throw error;

  await supabase
    .from("conversation_messages")
    .update({
      pinned: true,
      pinned_at: new Date().toISOString(),
      pinned_by: params.pinnedBy,
    })
    .eq("id", params.messageId);
}

export async function unpinMessage(messageId: string): Promise<void> {
  await supabase.from("conversation_message_pins").delete().eq("message_id", messageId);
  const { error } = await supabase
    .from("conversation_messages")
    .update({ pinned: false, pinned_at: null, pinned_by: null })
    .eq("id", messageId);
  if (error) throw error;
}
