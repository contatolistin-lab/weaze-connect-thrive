import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ConversationMessage } from "./conversations";

type MessageHandler = (msg: ConversationMessage) => void;
type MemberHandler = (payload: { type: "INSERT" | "DELETE"; member: any }) => void;

const channels = new Map<string, RealtimeChannel>();
const messageHandlers = new Map<string, Set<MessageHandler>>();
const memberHandlers = new Map<string, Set<MemberHandler>>();

export function subscribeToConversation(
  conversationId: string,
  onMessage: MessageHandler,
  onMemberChange?: MemberHandler
): () => void {
  if (channels.has(conversationId)) {
    messageHandlers.get(conversationId)?.add(onMessage);
    if (onMemberChange) memberHandlers.get(conversationId)?.add(onMemberChange);
    return () => unsubscribeFromConversation(conversationId, onMessage, onMemberChange ?? undefined);
  }

  const ch = supabase.channel(`conv-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as ConversationMessage;
        if (msg.deleted === false) {
          messageHandlers.get(conversationId)?.forEach((h) => h(msg));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversation_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as ConversationMessage;
        if (msg.deleted === false) {
          messageHandlers.get(conversationId)?.forEach((h) => h(msg));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversation_members",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        memberHandlers.get(conversationId)?.forEach((h) => h({ type: "INSERT", member: payload.new }));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "conversation_members",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        memberHandlers.get(conversationId)?.forEach((h) => h({ type: "DELETE", member: payload.old }));
      }
    )
    .subscribe();

  channels.set(conversationId, ch);
  messageHandlers.set(conversationId, new Set([onMessage]));
  if (onMemberChange) {
    memberHandlers.set(conversationId, new Set([onMemberChange]));
  }

  return () => unsubscribeFromConversation(conversationId, onMessage, onMemberChange);
}

function unsubscribeFromConversation(
  conversationId: string,
  onMessage: MessageHandler,
  onMemberChange?: MemberHandler
): void {
  messageHandlers.get(conversationId)?.delete(onMessage);
  if (onMemberChange) memberHandlers.get(conversationId)?.delete(onMemberChange);

  if (
    (messageHandlers.get(conversationId)?.size ?? 0) === 0 &&
    (memberHandlers.get(conversationId)?.size ?? 0) === 0
  ) {
    const ch = channels.get(conversationId);
    if (ch) {
      supabase.removeChannel(ch);
      channels.delete(conversationId);
      messageHandlers.delete(conversationId);
      memberHandlers.delete(conversationId);
    }
  }
}

export function unsubscribeAll(): void {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels.clear();
  messageHandlers.clear();
  memberHandlers.clear();
}
