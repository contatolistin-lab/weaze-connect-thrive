import { supabase } from "@/integrations/supabase/client";

export type B2CGroup = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  members_count?: number;
};

export type B2CGroupPost = {
  id: string;
  group_id: string;
  author_id: string;
  content: string | null;
  created_at: string;
  profiles?: { name: string | null; avatar_url: string | null };
};

export type B2CGroupMember = {
  user_id: string;
  profiles?: { name: string | null; avatar_url: string | null };
};

export type B2CGroupWithPreview = B2CGroup & {
  last_activity: string | null;
  last_preview: string | null;
  last_author_name: string | null;
  unread_count: number;
};

export async function getMyGroups(userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members!inner(user_id)")
    .eq("group_members.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null as B2CGroup[] | null, error: error.message };
  return { data: data as unknown as B2CGroup[], error: null };
}

function getLastVisitKey(groupId: string) {
  return `group_last_visit_${groupId}`;
}

async function getProfileName(userId: string): Promise<string | null> {
  const { data } = await supabase.rpc("get_profiles_by_ids", { p_user_ids: [userId] });
  const profiles = data as { user_id: string; name: string }[] | null;
  return profiles?.[0]?.name || null;
}

export async function getMyGroupsWithPreview(userId: string) {
  const { data: memberships, error: memError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (memError) return { data: null as B2CGroupWithPreview[] | null, error: memError.message };
  if (!memberships || memberships.length === 0) return { data: [] as B2CGroupWithPreview[], error: null };

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsError) return { data: null as B2CGroupWithPreview[] | null, error: groupsError.message };

  const enriched: B2CGroupWithPreview[] = await Promise.all(
    (groupsData as B2CGroup[]).map(async (group) => {
      const { data: lastPost } = await supabase
        .from("group_posts")
        .select("content, created_at, author_id")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastActivity = lastPost?.created_at || null;
      const lastPreview = lastPost?.content || null;
      const lastAuthorName = lastPost?.author_id ? await getProfileName(lastPost.author_id) : null;

      const lastVisit = localStorage.getItem(getLastVisitKey(group.id));
      let unreadCount = 0;
      if (lastVisit) {
        const parsed = new Date(lastVisit);
        const isValid = !isNaN(parsed.getTime()) && parsed.getTime() > 0;
        const since = isValid ? lastVisit : new Date(0).toISOString();
        const { count } = await supabase
          .from("group_posts")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)
          .gt("created_at", since);
        unreadCount = count || 0;
      }

      return { ...group, last_activity: lastActivity, last_preview: lastPreview, last_author_name: lastAuthorName, unread_count: unreadCount };
    })
  );

  return { data: enriched, error: null };
}

export function markGroupVisited(groupId: string) {
  localStorage.setItem(getLastVisitKey(groupId), new Date().toISOString());
}

export async function getGroupDetail(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) return { data: null as B2CGroup | null, error: error.message };
  return { data: data as unknown as B2CGroup, error: null };
}

export async function getGroupMembersCount(groupId: string) {
  const { count, error } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) return { count: 0, error: error.message };
  return { count: count || 0, error: null };
}

export async function getGroupPosts(groupId: string) {
  const { data, error } = await supabase
    .from("group_posts")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) return { data: null as B2CGroupPost[] | null, error: error.message };

  const posts = data as B2CGroupPost[];
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .rpc("get_profiles_by_ids", { p_user_ids: authorIds });
    const profileMap = Object.fromEntries(
      (profiles as { user_id: string; name: string; avatar_url: string | null }[] | null)?.map((p) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]) || []
    );
    for (const post of posts) {
      post.profiles = profileMap[post.author_id] || null;
    }
  }

  return { data: posts, error: null };
}

export async function canCreateGroupPost(groupId: string, _userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .single();

  if (!group) return { allowed: false, reason: "Grupo não encontrado" };

  return { allowed: true };
}

export async function createGroupPost(groupId: string, authorId: string, content: string) {
  const { data, error } = await supabase
    .from("group_posts")
    .insert({
      group_id: groupId,
      author_id: authorId,
      title: content.slice(0, 60),
      content,
    })
    .select()
    .single();

  if (error) return { data: null as B2CGroupPost | null, error: error.message };

  if (data) {
    const { data: profileData } = await supabase.rpc("get_profiles_by_ids", {
      p_user_ids: [authorId],
    });
    const profile = (profileData && profileData.length > 0)
      ? { name: profileData[0].name, avatar_url: profileData[0].avatar_url }
      : null;
    return { data: { ...data, profiles: profile } as B2CGroupPost, error: null };
  }

  return { data: data as unknown as B2CGroupPost, error: null };
}

export async function updateGroupPost(postId: string, content: string) {
  const { data, error } = await supabase
    .from("group_posts")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .select()
    .single();

  if (error) return { data: null as B2CGroupPost | null, error: error.message };
  return { data: data as unknown as B2CGroupPost, error: null };
}

export async function deleteGroupPost(postId: string) {
  const { error } = await supabase
    .from("group_posts")
    .delete()
    .eq("id", postId);

  return { error: error?.message || null };
}

export type B2CGroupReply = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: { name: string | null; avatar_url: string | null };
};

export async function getGroupPostReplies(postId: string): Promise<{ data: B2CGroupReply[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("group_replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };

  const replies = data as B2CGroupReply[];
  const authorIds = [...new Set(replies.map(r => r.author_id))];
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .rpc("get_profiles_by_ids", { p_user_ids: authorIds });
    const profileMap = Object.fromEntries(
      (profiles as { user_id: string; name: string; avatar_url: string | null }[] | null)?.map(p => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]) || []
    );
    for (const reply of replies) {
      reply.profiles = profileMap[reply.author_id] || null;
    }
  }

  return { data: replies, error: null };
}

export async function createGroupPostReply(postId: string, authorId: string, content: string): Promise<{ data: B2CGroupReply | null; error: string | null }> {
  const { data, error } = await supabase
    .from("group_replies")
    .insert({
      post_id: postId,
      author_id: authorId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const reply = data as B2CGroupReply;
  const { data: profileData } = await supabase
    .rpc("get_profiles_by_ids", { p_user_ids: [authorId] });
  const profile = (profileData && profileData.length > 0)
    ? { name: profileData[0].name, avatar_url: profileData[0].avatar_url }
    : null;

  return { data: { ...reply, profiles: profile }, error: null };
}
