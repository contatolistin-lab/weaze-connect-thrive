import { useState, useEffect, useCallback } from "react";

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

const STORAGE_KEY = "weaze_support_messages";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function loadAll(): SupportMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(messages: SupportMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function useSupportMessages(communityId?: string) {
  const [messages, setMessages] = useState<SupportMessage[]>(() => loadAll());

  useEffect(() => {
    saveAll(messages);
  }, [messages]);

  const filtered = communityId
    ? messages.filter((m) => m.community_id === communityId)
    : messages;

  const create = useCallback(
    (data: {
      community_id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      type: SupportType;
      subject: string;
      message: string;
    }) => {
      const now = new Date().toISOString();
      const msg: SupportMessage = {
        id: generateId(),
        ...data,
        status: "pendente",
        created_at: now,
        updated_at: now,
      };
      setMessages((prev) => [msg, ...prev]);
      return msg;
    },
    []
  );

  const updateStatus = useCallback(
    (id: string, status: SupportStatus) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status, updated_at: new Date().toISOString() } : m
        )
      );
    },
    []
  );

  const getById = useCallback(
    (id: string) => messages.find((m) => m.id === id) ?? null,
    [messages]
  );

  const stats = {
    pendentes: filtered.filter((m) => m.status === "pendente").length,
    em_analise: filtered.filter((m) => m.status === "em_analise").length,
    respondidos: filtered.filter((m) => m.status === "respondido").length,
    total: filtered.length,
  };

  return { messages: filtered, create, updateStatus, getById, stats };
}
