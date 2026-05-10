import { supabase } from "@/integrations/supabase/client";
import type { ForumConversation, ForumReply } from "@/lib/forumConversations";
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  description: string | null;
  replies_count: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { name: string | null; avatar_url: string | null } | null;
};

export type ForumReply = {
  id: string;
  conversation_id: string;
  user_id: string;
  reply_to_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: { name: string | null; avatar_url: string | null } | null;
};

export async function getConversations(tenantId: string): Promise<ForumConversation[]> {
  const { data, error } = await supabase
    .from("conversations_forum")
    .select("*, profiles(name, avatar_url)")
    .eq("tenant_id", tenantId)
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConversation(id: string): Promise<ForumConversation | null> {
  const { data, error } = await supabase
    .from("conversations_forum")
    .select("*, profiles(name, avatar_url)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createConversation(
  tenantId: string,
  userId: string,
  title: string,
  description: string | null
): Promise<ForumConversation> {
  const { data, error } = await supabase
    .from("conversations_forum")
    .insert({ tenant_id: tenantId, user_id: userId, title, description, replies_count: 0 })
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from("conversations_forum")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getReplies(conversationId: string): Promise<ForumReply[]> {
  const { data, error } = await supabase
    .from("conversation_replies")
    .select("*, profiles(name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createReply(
  conversationId: string,
  userId: string,
  content: string,
  replyToId: string | null = null
): Promise<ForumReply> {
  const { data: reply, error: replyError } = await supabase
    .from("conversation_replies")
    .insert({ conversation_id: conversationId, user_id: userId, content, reply_to_id: replyToId })
    .select("*, profiles(name, avatar_url)")
    .single();

  if (replyError) throw replyError;

  await supabase.rpc("increment_replies_count", { conv_id: conversationId });

  return reply;
}

export async function updateReply(id: string, content: string): Promise<ForumReply> {
  const { data, error } = await supabase
    .from("conversation_replies")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReply(id: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_replies")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await supabase.rpc("decrement_replies_count", { conv_id: conversationId });
}