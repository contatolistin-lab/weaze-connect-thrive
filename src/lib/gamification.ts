import { supabase } from "@/integrations/supabase/client";
export type ActionType = "post_like" | "comment_created" | "reply_created" | "reply_received" | "live_participation" | "cta_click";
export const POINTS: Record<ActionType, number> = {
  post_like: 1,
  comment_created: 2,
  reply_created: 3,
  reply_received: 5,
  live_participation: 10,
  cta_click: 2,
};
export type RankingEntry = { rank: number; user_id: string; name: string; avatar_url: string | null; city: string | null; state: string | null; points: number };
export type UserPoints = { total_points: number; monthly_points: number; yearly_points: number; monthly_rank: number; yearly_rank: number };
export async function awardPoints(userId: string, tenantId: string, actionType: ActionType, referenceId?: string, extraPoints?: number): Promise<number> {
  let pts = POINTS[actionType] ?? 1;
  if (extraPoints !== undefined) pts = extraPoints;
  if (pts <= 0) return 0;
  try {
    const { error } = await supabase.rpc("award_engagement_points", {
      p_user_id: userId, p_tenant_id: tenantId, p_action_type: actionType, p_points: pts, p_reference_id: referenceId ?? null, p_metadata: {},
    });
    if (error) { console.error("awardPoints:", error); return 0; }
    return pts;
  } catch (e) { console.error("awardPoints:", e); return 0; }
}
export async function getUserStats(userId: string, tenantId: string): Promise<UserPoints | null> {
  try {
    const { data, error } = await supabase.rpc("get_user_engagement_stats", { p_user_id: userId, p_tenant_id: tenantId });
    if (error || !data || data.length === 0) return null;
    const r = data[0];
    return { total_points: r.total_points ?? 0, monthly_points: r.monthly_points ?? 0, yearly_points: r.yearly_points ?? 0, monthly_rank: r.monthly_rank ?? 0, yearly_rank: r.yearly_rank ?? 0 };
  } catch (e) { console.error("getUserStats:", e); return null; }
}
export async function getMonthlyRanking(tenantId: string, limit = 10): Promise<RankingEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_monthly_ranking", { p_tenant_id: tenantId, p_limit: limit });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({ rank: r.rank ?? 0, user_id: r.user_id ?? "", name: r.name ?? "Usuário", avatar_url: r.avatar_url ?? null, city: r.city ?? null, state: r.state ?? null, points: r.monthly_points ?? 0 }));
  } catch (e) { console.error("getMonthlyRanking:", e); return []; }
}
export async function getYearlyRanking(tenantId: string, limit = 10): Promise<RankingEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_yearly_ranking", { p_tenant_id: tenantId, p_limit: limit });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({ rank: r.rank ?? 0, user_id: r.user_id ?? "", name: r.name ?? "Usuário", avatar_url: r.avatar_url ?? null, city: r.city ?? null, state: r.state ?? null, points: r.yearly_points ?? 0 }));
  } catch (e) { console.error("getYearlyRanking:", e); return []; }
}
export async function updateLocation(userId: string, loc: { city?: string; state?: string; country?: string }): Promise<boolean> {
  try {
    const updates: Record<string, string> = {};
    if (loc.city) updates.city = loc.city;
    if (loc.state) updates.state = loc.state;
    if (loc.country) updates.country = loc.country;
    if (Object.keys(updates).length === 0) return true;
    const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
    if (error) { console.error("updateLocation:", error); return false; }
    return true;
  } catch (e) { console.error("updateLocation:", e); return false; }
}
export type TenantReward = { id: string; tenant_id: string; title: string; description: string | null; award_type: string; award_value: string | null; min_position: number };
export async function getTenantRewards(tenantId: string): Promise<TenantReward[]> {
  try {
    const { data, error } = await supabase.from("tenant_rewards").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("min_position");
    if (error || !data) return [];
    return data as TenantReward[];
  } catch (e) { console.error("getTenantRewards:", e); return []; }
}