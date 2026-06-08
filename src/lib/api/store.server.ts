import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const STORAGE_FILE = path.join(os.tmpdir(), "weaze-support-messages.json");

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

export function readMessages(): SupportMessage[] {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return [];
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    return JSON.parse(raw) as SupportMessage[];
  } catch {
    return [];
  }
}

export function writeMessages(messages: SupportMessage[]): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(messages), "utf-8");
  } catch (e) {
    console.error("Failed to persist support messages:", e);
  }
}
