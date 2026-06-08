import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readMessages, writeMessages, type SupportMessage } from "./store.server";

export type { SupportMessage };
export type SupportType = "duvida" | "sugestao" | "problema";
export type SupportStatus = "pendente" | "em_analise" | "respondido";

export const getSupportMessages = createServerFn({ method: "POST" })
  .inputValidator(z.object({ communityId: z.string() }))
  .handler(async ({ data }) => {
    const messages = readMessages();
    return messages.filter((m) => m.community_id === data.communityId);
  });

export const createSupportMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      community_id: z.string(),
      user_id: z.string(),
      user_name: z.string(),
      user_email: z.string(),
      type: z.enum(["duvida", "sugestao", "problema"]),
      subject: z.string(),
      message: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const now = new Date().toISOString();
    const msg: SupportMessage = {
      id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      status: "pendente",
      created_at: now,
      updated_at: now,
    };
    const messages = readMessages();
    messages.unshift(msg);
    writeMessages(messages);
    return msg;
  });

export const updateSupportStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(["pendente", "em_analise", "respondido"]),
    })
  )
  .handler(async ({ data }) => {
    const messages = readMessages();
    const idx = messages.findIndex((m) => m.id === data.id);
    if (idx === -1) throw new Error("Mensagem não encontrada");
    messages[idx] = {
      ...messages[idx],
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    writeMessages(messages);
    return messages[idx];
  });
