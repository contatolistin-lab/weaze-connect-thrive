const GLOBAL_MESSAGES_KEY = "__weaze_support_messages__";

export type SupportType = "duvida" | "sugestao" | "problema";
export type SupportStatus = "pendente" | "em_analise" | "respondido";

export type SupportMessage = {
  id: string;
  community_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: SupportType;
  subject: string;
  message: string;
  status: SupportStatus;
  created_at: string;
  updated_at: string;
};

type SupportGlobal = typeof globalThis & {
  [GLOBAL_MESSAGES_KEY]?: SupportMessage[];
};

function getMessages(): SupportMessage[] {
  const shared = globalThis as SupportGlobal;
  if (!shared[GLOBAL_MESSAGES_KEY]) {
    shared[GLOBAL_MESSAGES_KEY] = [];
  }
  return shared[GLOBAL_MESSAGES_KEY];
}

function saveMessages(messages: SupportMessage[]): void {
  const shared = globalThis as SupportGlobal;
  shared[GLOBAL_MESSAGES_KEY] = [...messages];
}

export function readMessages(): SupportMessage[] {
  const msgs = [...getMessages()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return msgs;
}

export function writeMessages(messages: SupportMessage[]): void {
  saveMessages(messages);
}
