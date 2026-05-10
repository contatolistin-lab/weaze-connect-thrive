import { useState, useEffect } from "react";
import { getReplies, createReply, updateReply, deleteReply, type ForumReply } from "@/lib/forumConversations";

export function useForumReplies(conversationId: string | null) {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!conversationId) {
      setReplies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getReplies(conversationId);
      setReplies(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  const addReply = (reply: ForumReply) => {
    setReplies(prev => [...prev, reply]);
  };

  const editReply = (id: string, content: string) => {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, content, updated_at: new Date().toISOString() } : r));
  };

  const removeReply = (id: string) => {
    setReplies(prev => prev.filter(r => r.id !== id));
  };

  const submit = async (userId: string, content: string, replyToId: string | null = null) => {
    if (!conversationId) return null;
    const reply = await createReply(conversationId, userId, content, replyToId);
    addReply(reply);
    return reply;
  };

  const edit = async (id: string, content: string) => {
    await updateReply(id, content);
    editReply(id, content);
  };

  const remove = async (id: string) => {
    if (!conversationId) return;
    await deleteReply(id, conversationId);
    removeReply(id);
  };

  return { replies, loading, error, submit, edit, remove };
}