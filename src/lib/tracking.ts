import { supabase } from "@/integrations/supabase/client";

type Action = "view" | "like" | "comment" | "click_cta" | "conversion";

export async function track(params: {
  tenantId: string;
  postId?: string | null;
  ctaId?: string | null;
  action: Action;
  metadata?: Record<string, any>;
}) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("interactions").insert({
    tenant_id: params.tenantId,
    post_id: params.postId ?? null,
    cta_id: params.ctaId ?? null,
    action_type: params.action,
    user_id: u.user?.id ?? null,
    metadata: params.metadata ?? {},
  });
}
