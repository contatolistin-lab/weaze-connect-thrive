import { supabase } from "@/integrations/supabase/client";
import type { AccessStatus } from "@/types/community";

export const getAccessStatus = async (
  tenantId: string,
  userId: string
): Promise<AccessStatus> => {
  if (!userId || !tenantId) return "none";

  const { data, error } = await supabase
    .from("community_members")
    .select("status")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) return "none";

  return data.status as AccessStatus;
};

export const requestAccess = async (
  tenantId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !tenantId) {
    return { success: false, error: "Missing user or tenant" };
  }

  const { error } = await supabase.from("community_members").insert({
    user_id: userId,
    tenant_id: tenantId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Request already exists" };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const approveRequest = async (
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: member } = await supabase
    .from("community_members")
    .select("tenant_id")
    .eq("id", requestId)
    .single();

  if (!member) return { success: false, error: "Request not found" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", member.tenant_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("community_members")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };

  return { success: true };
};

export const rejectRequest = async (
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: member } = await supabase
    .from("community_members")
    .select("tenant_id")
    .eq("id", requestId)
    .single();

  if (!member) return { success: false, error: "Request not found" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", member.tenant_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("community_members")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };

  return { success: true };
};

export const getPendingRequests = async (
  tenantId: string,
  adminUserId: string
): Promise<{ data: any[]; error?: string }> => {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", tenantId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { data: [], error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("community_members")
    .select(`
      id,
      user_id,
      tenant_id,
      status,
      created_at,
      profiles (
        name,
        email
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  return { data: data || [] };
};