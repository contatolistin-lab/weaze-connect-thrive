import { supabase } from "@/integrations/supabase/client";

export const getAccessStatus = async (
  tenantId: string,
  userId: string
): Promise<string> => {
  if (!userId || !tenantId) return "none";

  const { data, error } = await supabase
    .from("memberships")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return "none";

  if (data.role === "owner" || data.role === "admin") return "approved";
  if (data.is_active === false) return "blocked";

  return "approved";
};

export const requestAccess = async (
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !tenantId) {
    return { success: false, error: "Missing user or tenant" };
  }

  const { error } = await supabase.from("community_requests").insert({
    tenant_id: tenantId,
    user_id: userId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Solicitação já existe" };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const approveRequest = async (
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: request } = await supabase
    .from("community_requests")
    .select("tenant_id, user_id")
    .eq("id", requestId)
    .single();

  if (!request) return { success: false, error: "Solicitação não encontrada" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", request.tenant_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Não autorizado" };
  }

  const { error: updateError } = await supabase
    .from("community_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: insertError } = await supabase.from("memberships").insert({
    tenant_id: request.tenant_id,
    user_id: request.user_id,
    role: "member",
  });

  if (insertError) return { success: false, error: insertError.message };

  return { success: true };
};

export const rejectRequest = async (
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: request } = await supabase
    .from("community_requests")
    .select("tenant_id")
    .eq("id", requestId)
    .single();

  if (!request) return { success: false, error: "Solicitação não encontrada" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", request.tenant_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Não autorizado" };
  }

  const { error } = await supabase
    .from("community_requests")
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
    return { data: [], error: "Não autorizado" };
  }

  const { data, error } = await supabase
    .from("community_requests")
    .select(`
      id,
      user_id,
      tenant_id,
      status,
      created_at,
      profiles (name, email)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  return { data: data || [] };
};

export const toggleMemberActive = async (
  memberUserId: string,
  tenantId: string,
  adminUserId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", tenantId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Não autorizado" };
  }

  const { data: targetMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", memberUserId)
    .eq("tenant_id", tenantId)
    .single();

  if (!targetMembership || targetMembership.role === "owner") {
    return { success: false, error: "Não é possível alterar este membro" };
  }

  try {
    const { error } = await supabase
      .from("memberships")
      .update({ is_active: isActive })
      .eq("user_id", memberUserId)
      .eq("tenant_id", tenantId);

    if (error) {
      if (error.message.includes("is_active")) {
        return { success: false, error: "Coluna is_active ainda não existe no banco" };
      }
      return { success: false, error: error.message };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }

  return { success: true };
};

export const removeMember = async (
  memberUserId: string,
  tenantId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", adminUserId)
    .eq("tenant_id", tenantId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Não autorizado" };
  }

  const { data: targetMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", memberUserId)
    .eq("tenant_id", tenantId)
    .single();

  if (!targetMembership || targetMembership.role === "owner") {
    return { success: false, error: "Não é possível remover este membro" };
  }

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("user_id", memberUserId)
    .eq("tenant_id", tenantId);

  if (error) return { success: false, error: error.message };

  return { success: true };
};

export const getTenantMembers = async (
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
    return { data: [], error: "Não autorizado" };
  }

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("user_id, role, is_active, created_at")
    .eq("tenant_id", tenantId)
    .neq("role", "owner");

  if (error) return { data: [], error: error.message };
  if (!memberships || memberships.length === 0) return { data: [], error: undefined };

  const userIds = memberships.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, email, avatar_url, city, state")
    .in("user_id", userIds);

  const profileMap: Record<string, any> = {};
  (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

  const result = memberships.map(m => ({
    ...m,
    profiles: profileMap[m.user_id] || null
  }));

  return { data: result, error: undefined };
};