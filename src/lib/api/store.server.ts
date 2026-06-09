import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const STORAGE_FILE = path.join(os.tmpdir(), "weaze-support-messages.json");
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

function loadFromFile(): SupportMessage[] {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return [];
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SupportMessage[]) : [];
  } catch {
    return [];
  }
}

function saveToFile(messages: SupportMessage[]): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(messages), "utf-8");
  } catch (e) {
    console.error("Failed to persist support messages to disk:", e);
  }
}

function getMessages(): SupportMessage[] {
  const shared = globalThis as SupportGlobal;
  if (!shared[GLOBAL_MESSAGES_KEY]) {
    shared[GLOBAL_MESSAGES_KEY] = loadFromFile();
  }
  return shared[GLOBAL_MESSAGES_KEY];
}

function saveMessages(messages: SupportMessage[]): void {
  const shared = globalThis as SupportGlobal;
  shared[GLOBAL_MESSAGES_KEY] = [...messages];
  saveToFile(messages);
}

export function readMessages(): SupportMessage[] {
  return [...getMessages()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function writeMessages(messages: SupportMessage[]): void {
  saveMessages(messages);
}

// WE-001: storage híbrido globalThis + fs para dev/prod
