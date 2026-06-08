import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSupportMessages,
  createSupportMessage as apiCreate,
  updateSupportStatus as apiUpdateStatus,
  type SupportType,
  type SupportStatus,
  type SupportMessage,
} from "@/lib/api/support-messages";

export type { SupportType, SupportStatus, SupportMessage };

export function useSupportMessages(communityId?: string) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!communityId) return;
    try {
      const data = await getSupportMessages({ data: { communityId } });
      setMessages(data);
    } catch (e) {
      console.error("Failed to fetch support messages:", e);
    }
  }, [communityId]);

  useEffect(() => {
    setLoading(true);
    fetchMessages().then(() => setLoading(false));

    intervalRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchMessages]);

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
      const msg = await apiCreate({ data });
      setMessages((prev) => [msg, ...prev]);
      return msg;
    },
    []
  );

  const updateStatus = useCallback(
    async (id: string, status: SupportStatus) => {
      try {
        const updated = await apiUpdateStatus({ data: { id, status } });
        setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      } catch (e) {
        console.error("Failed to update support message status:", e);
      }
    },
    []
  );

  const getById = useCallback(
    (id: string) => messages.find((m) => m.id === id) ?? null,
    [messages]
  );

  const stats = {
    pendentes: messages.filter((m) => m.status === "pendente").length,
    em_analise: messages.filter((m) => m.status === "em_analise").length,
    respondidos: messages.filter((m) => m.status === "respondido").length,
    total: messages.length,
  };

  return { messages, create, updateStatus, getById, stats, loading };
}
