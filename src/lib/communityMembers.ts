import { supabase } from "@/integrations/supabase/client";

export type MemberStatus = "none" | "pending" | "approved" | "rejected";

export type CommunityMember = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: MemberStatus;
  created_at: string;
  approved_at: string | null;
};

export type PendingMember = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string | null;
};

export const getMemberStatus = async (tenantId: string): Promise<MemberStatus> => {
  const { data, error } = await (supabase as any).rpc("get_member_status", { p_tenant_id: tenantId });
  if (error) {
    console.error("Error getting member status:", error);
    return "none";
  }
  return (data as MemberStatus) || "none";
};

export const requestJoinCommunity = async (tenantId: string): Promise<{ id: string; status: string } | null> => {
  const { data, error } = await (supabase as any).rpc("request_community_join", { p_tenant_id: tenantId });
  if (error) {
    console.error("Error requesting join:", error);
    return null;
  }
  return data as { id: string; status: string };
};

export const approveMember = async (membershipId: string): Promise<boolean> => {
  const { data, error } = await (supabase as any).rpc("approve_community_member", { p_membership_id: membershipId });
  if (error) {
    console.error("Error approving member:", error);
    return false;
  }
  return data === true;
};

export const rejectMember = async (membershipId: string): Promise<boolean> => {
  const { data, error } = await (supabase as any).rpc("reject_community_member", { p_membership_id: membershipId });
  if (error) {
    console.error("Error rejecting member:", error);
    return false;
  }
  return data === true;
};

export const getPendingMembers = async (tenantId: string): Promise<PendingMember[]> => {
  const { data, error } = await (supabase as any).rpc("get_pending_members", { p_tenant_id: tenantId });
  if (error) {
    console.error("Error getting pending members:", error);
    return [];
  }
  return data as PendingMember[];
};

export const checkAccess = async (tenantId: string): Promise<{
  hasAccess: boolean;
  status: MemberStatus;
}> => {
  const status = await getMemberStatus(tenantId);
  return {
    hasAccess: status === "approved",
    status
  };
};