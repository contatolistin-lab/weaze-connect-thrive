import { useCallback, useEffect, useSyncExternalStore } from "react";

export type SupportType = "duvida" | "sugestao" | "problema";
export type SupportStatus = "pendente" | "em_analise" | "respondido";

export interface SupportMessage {
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
}

const STORAGE_KEY = "weaze_support_messages";

function read(): SupportMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupportMessage[]) : [];
  } catch {
    return [];
  }
}

function write(items: SupportMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("weaze_support_changed"));
  } catch {
    /* silent */
  }
}

const subscribers = new Set<() => void>();
function subscribe(cb: () => void) {
  subscribers.add(cb);
  const handler = () => cb();
  window.addEventListener("weaze_support_changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener("weaze_support_changed", handler);
    window.removeEventListener("storage", handler);
  };
}

export function communitySlug(name: string): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, "-") || "minha-comunidade";
}

export const supportTypeLabel: Record<SupportType, string> = {
  duvida: "Dúvida",
  sugestao: "Sugestão",
  problema: "Problema",
};

export const supportStatusLabel: Record<SupportStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  respondido: "Respondido",
};

export const supportStatusColor: Record<SupportStatus, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  em_analise: "bg-blue-100 text-blue-800 border-blue-200",
  respondido: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function useSupportMessages(communityId?: string): SupportMessage[] {
  const [hydrated, setHydrated] = useStateHydrated();
  const items = useSyncExternalStore(
    subscribe,
    () => read(),
    () => [],
  );
  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);
  if (!hydrated) return [];
  return communityId ? items.filter((i) => i.community_id === communityId) : items;
}

function useStateHydrated(): [boolean, (v: boolean) => void] {
  const [v, setV] = useStateLike(false);
  return [v, setV];
}

// Lightweight useState to avoid extra import noise
import { useState as useStateLike } from "react";

export function useAddSupportMessage() {
  return useCallback(
    (input: Omit<SupportMessage, "id" | "status" | "created_at" | "updated_at">) => {
      const now = new Date().toISOString();
      const item: SupportMessage = {
        ...input,
        id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "pendente",
        created_at: now,
        updated_at: now,
      };
      const items = read();
      items.unshift(item);
      write(items);
      return item;
    },
    [],
  );
}

export function useUpdateSupportStatus() {
  return useCallback((id: string, status: SupportStatus) => {
    const items = read();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], status, updated_at: new Date().toISOString() };
    write(items);
  }, []);
}
