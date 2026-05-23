import { useState, useCallback, useRef, useEffect } from "react";
import {
  getGroupDetail,
  getGroupMembersCount,
  getGroupPosts,
  canCreateGroupPost,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
  B2CGroup,
  B2CGroupPost,
  B2CGroupReply,
  getGroupPostReplies,
  createGroupPostReply,
} from "@/services/groupsB2CService";

export function useB2CGroupDetail(groupId: string | null) {
  const [group, setGroup] = useState<B2CGroup | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [posts, setPosts] = useState<B2CGroupPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);

  const [replies, setReplies] = useState<Record<string, B2CGroupReply[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [repliesLoading, setRepliesLoading] = useState<Record<string, boolean>>({});
  const [sendingReply, setSendingReply] = useState(false);

  const repliesRef = useRef(replies);
  useEffect(() => { repliesRef.current = replies; }, [replies]);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    const [groupResult, countResult, postsResult] = await Promise.all([
      getGroupDetail(groupId),
      getGroupMembersCount(groupId),
      getGroupPosts(groupId),
    ]);

    setLoading(false);

    if (groupResult.error) {
      setError(groupResult.error);
      return;
    }
    if (countResult.error) {
      setError(countResult.error);
      return;
    }
    if (postsResult.error) {
      setError(postsResult.error);
      return;
    }

    setGroup(groupResult.data);
    setMembersCount(countResult.count);
    setPosts(postsResult.data || []);
  }, [groupId]);

  const checkCanPost = useCallback(async (userId: string) => {
    if (!groupId) return;
    const result = await canCreateGroupPost(groupId, userId);
    setCanPost(result.allowed);
    if (!result.allowed) setPostError(result.reason || null);
    else setPostError(null);
  }, [groupId]);

  const sendPost = useCallback(
    async (authorId: string, content: string) => {
      if (!groupId) return { success: false, error: "Grupo não definido" };
      const permission = await canCreateGroupPost(groupId, authorId);
      if (!permission.allowed) return { success: false, error: permission.reason || "Sem permissão" };
      setSending(true);
      const result = await createGroupPost(groupId, authorId, content);
      setSending(false);
      if (result.error) return { success: false, error: result.error };
      if (result.data) {
        setPosts((prev) => [result.data!, ...prev]);
      }
      return { success: true };
    },
    [groupId]
  );

  const editPost = useCallback(async (postId: string, content: string) => {
    const result = await updateGroupPost(postId, content);
    if (result.error) return { success: false, error: result.error };
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p))
    );
    return { success: true };
  }, []);

  const removePost = useCallback(async (postId: string) => {
    const result = await deleteGroupPost(postId);
    if (result.error) return { success: false, error: result.error };
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    return { success: true };
  }, []);

  const openReplies = useCallback(async (postId: string) => {
    if (repliesRef.current[postId]) {
      setReplyingTo(postId);
      return;
    }

    setRepliesLoading(prev => ({ ...prev, [postId]: true }));
    setReplyingTo(postId);

    const result = await getGroupPostReplies(postId);
    if (!result.error && result.data) {
      setReplies(prev => ({ ...prev, [postId]: result.data }));
    }
    setRepliesLoading(prev => ({ ...prev, [postId]: false }));
  }, []);

  const sendReply = useCallback(async (postId: string, authorId: string, content: string) => {
    if (!content.trim()) return { success: false, error: "Conteúdo vazio" };

    setSendingReply(true);
    const result = await createGroupPostReply(postId, authorId, content.trim());
    setSendingReply(false);

    if (result.error) return { success: false, error: result.error };
    if (result.data) {
      setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), result.data!] }));
    }
    return { success: true };
  }, []);

  return { group, membersCount, posts, loading, sending, error, canPost, postError, load, sendPost, checkCanPost, editPost, removePost, replies, replyingTo, repliesLoading, sendingReply, openReplies, sendReply };
}
