import { useState, useEffect } from "react";
import { getConversations, createConversation, deleteConversation, type ForumConversation } from "@/lib/forumConversations";

export function useForumConversations(tenantId: string | null) {
  const [conversations, setConversations] = useState<ForumConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!tenantId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getConversations(tenantId);
      setConversations(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const addConversation = (conv: ForumConversation) => {
    setConversations(prev => [conv, ...prev]);
  };

  const removeConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const create = async (userId: string, title: string, description: string | null) => {
    if (!tenantId) return null;
    const conv = await createConversation(tenantId, userId, title, description);
    addConversation(conv);
    return conv;
  };

  const remove = async (id: string) => {
    await deleteConversation(id);
    removeConversation(id);
  };

  return { conversations, loading, error, create, remove, refetch: load };
}