import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

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

function mapRow(row: any): SupportMessage {
  return {
    id: row.id,
    community_id: row.tenant_id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    type: row.type,
    subject: row.subject,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useSupportMessages(communityId?: string) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      let query = supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (communityId) {
        query = query.eq("tenant_id", communityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages((data || []).map(mapRow));
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("support_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          ...(communityId ? { filter: `tenant_id=eq.${communityId}` } : {}),
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any;
            if (!communityId || row.tenant_id === communityId) {
              setMessages((prev) => [mapRow(row), ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as any;
            setMessages((prev) =>
              prev.map((m) => (m.id === row.id ? mapRow(row) : m))
            );
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as any;
            setMessages((prev) => prev.filter((m) => m.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const create = useCallback(
    async (data: {
      community_id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      type: SupportType;
      subject: string;
      message: string;
    }) => {
      const { error } = await supabase.from("support_messages").insert({
        tenant_id: data.community_id,
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        type: data.type,
        subject: data.subject,
        message: data.message,
        status: "pendente",
      });

      if (error) throw error;
    },
    []
  );

  const updateStatus = useCallback(
    async (id: string, status: SupportStatus) => {
      const { error } = await supabase
        .from("support_messages")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const getById = useCallback(
    (id: string) => messages.find((m) => m.id === id) ?? null,
    [messages]
  );

  const filtered = communityId
    ? messages.filter((m) => m.community_id === communityId)
    : messages;

  const stats = {
    pendentes: filtered.filter((m) => m.status === "pendente").length,
    em_analise: filtered.filter((m) => m.status === "em_analise").length,
    respondidos: filtered.filter((m) => m.status === "respondido").length,
    total: filtered.length,
  };

  return { messages: filtered, create, updateStatus, getById, stats, loading };
}
