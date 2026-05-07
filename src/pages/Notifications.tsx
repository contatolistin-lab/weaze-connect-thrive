import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getPendingRequests, approveRequest, rejectRequest } from "@/lib/communityAccess";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Building2 } from "lucide-react";

type TenantInfo = {
  id: string;
  name: string;
  slug: string;
};

type PendingRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  profiles?: {
    name: string | null;
    email: string;
  };
};

export default function Notifications() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();

  const [b2bNotifications, setB2bNotifications] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadB2BNotifications = async () => {
    if (!user || !isB2B) {
      setLoading(false);
      return;
    }

    let tenantList: TenantInfo[] = [];

    if (tenants && tenants.length > 0) {
      tenantList = tenants as TenantInfo[];
    } else {
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id, tenants(id, name, slug)")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"]);

      if (mems) {
        tenantList = mems.map((m: any) => m.tenants).filter(Boolean) as TenantInfo[];
      }
    }

    if (tenantList.length === 0) {
      setB2bNotifications([]);
      setLoading(false);
      return;
    }

    const allRequests: PendingRequest[] = [];

    for (const tenant of tenantList) {
      const { data, error } = await getPendingRequests(tenant.id, user.id);
      if (!error && data) {
        allRequests.push(...data);
      }
    }

    allRequests.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    setB2bNotifications(allRequests);
    setLoading(false);
  };

  useEffect(() => {
    loadB2BNotifications();
  }, [user, isB2B, tenants]);

  const handleApprove = async (requestId: string, tenantId: string) => {
    if (!user) return;

    await supabase.rpc("approve_community_member", { p_membership_id: requestId });
    await loadB2BNotifications();
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;

    await rejectRequest(requestId, user.id);
    await loadB2BNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Notificações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {isB2B ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Solicitações de acesso</h2>

            {b2bNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação de acesso no momento</p>
              </div>
            ) : (
              b2bNotifications.map((notification) => (
                <div key={notification.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-semibold">{notification.profiles?.name || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {notification.profiles?.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Solicitado em: {formatDate(notification.created_at)}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={() => handleApprove(notification.id, notification.tenant_id)}
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleReject(notification.id)}
                    >
                      <X className="h-4 w-4" />
                      Recusar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}