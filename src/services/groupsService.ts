import { supabase } from "@/integrations/supabase/client";

export type Group = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  members_count?: number;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  };
};

export type MemberSearchResult = {
  user_id: string;
  name: string;
  avatar_url: string | null;
};

export const groupsService = {
  async list(tenantId: string): Promise<{ data: Group[]; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  },

  async create(
    tenantId: string,
    userId: string,
    name: string,
    type: "private" | "internal"
  ): Promise<{ data: Group | null; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        type,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async delete(groupId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    return { error: error?.message || null };
  },

  async getMembers(groupId: string): Promise<{ data: GroupMember[]; error: string | null }> {
    const { data, error } = await supabase
      .from("group_members")
      .select("*, profiles(name, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  },

  async addMember(
    groupId: string,
    userId: string,
    addedBy: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: userId,
        added_by: addedBy,
      })
      .select()
      .single();

    return { error: error?.message || null };
  },

  async removeMember(groupMemberId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", groupMemberId);

    return { error: error?.message || null };
  },

  async searchMembers(
    tenantId: string,
    groupId: string,
    query: string,
    limit: number = 15
  ): Promise<{ data: MemberSearchResult[]; error: string | null }> {
    console.log("[groupsService] searchMembers called:", { tenantId, groupId, query, length: query.length });
    
    if (query.length < 3) {
      console.log("[groupsService] Query too short, skipping");
      return { data: [], error: null };
    }

    const { data: membersInGroup, error: groupError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    console.log("[groupsService] Members in group:", membersInGroup?.length || 0, groupError);

    if (groupError) return { data: [], error: groupError.message };

    const excludedUserIds = (membersInGroup || []).map((m) => m.user_id);

    const { data: membershipsData, error: memError } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .neq("role", "owner");

    console.log("[groupsService] Memberships found:", membershipsData?.length || 0, memError);

    if (memError) return { data: [], error: memError.message };

    const availableUserIds = (membershipsData || [])
      .map((m) => m.user_id)
      .filter((id) => !excludedUserIds.includes(id));

    console.log("[groupsService] Available user IDs:", availableUserIds.length);

    if (availableUserIds.length === 0) return { data: [], error: null };

    const { data: profilesData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", availableUserIds)
      .ilike("name", `%${query}%`);

    console.log("[groupsService] Profiles found:", profilesData?.length || 0, profileError);

    if (profileError) return { data: [], error: profileError.message };

    const result = (profilesData || [])
      .slice(0, limit)
      .map((p) => ({
        user_id: p.id,
        name: p.name || "Usuário",
        avatar_url: p.avatar_url,
      }));

    console.log("[groupsService] Final result:", result.length);
    return { data: result, error: null };
  },

  async getGroup(groupId: string): Promise<{ data: Group | null; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
};