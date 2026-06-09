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

// Shared in-memory store. Using globalThis keeps the same array across HMR
// reloads and across all server function invocations within the same worker
// instance — so B2C writes and B2B reads consume the SAME source of truth.
const GLOBAL_KEY = "__weaze_support_messages__";

type GlobalStore = { [GLOBAL_KEY]?: SupportMessage[] };
const g = globalThis as unknown as GlobalStore;

if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = [];
}

export function readMessages(): SupportMessage[] {
  return g[GLOBAL_KEY] ?? [];
}

export function writeMessages(messages: SupportMessage[]): void {
  g[GLOBAL_KEY] = messages;
}
