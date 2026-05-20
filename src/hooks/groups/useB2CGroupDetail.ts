import { useState, useCallback } from "react";
import {
  getGroupDetail,
  getGroupMembersCount,
  getGroupPosts,
  canCreateGroupPost,
  createGroupPost,
  B2CGroup,
  B2CGroupPost,
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

  return { group, membersCount, posts, loading, sending, error, canPost, postError, load, sendPost, checkCanPost };
}
