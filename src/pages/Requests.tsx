import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Building2, Clock } from "lucide-react";

type AccessRequest = {
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

export default function Requests() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user || !isB2B) {
        navigate("/");
        return;
      }

      let tenantIds: string[] = [];

      if (tenants && tenants.length > 0) {
        tenantIds = tenants.map((t: any) => t.id);
      } else {
        const { data: mems } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .in("role", ["owner", "admin"]);

        if (mems) {
          tenantIds = mems.map(m => m.tenant_id);
        }
      }

      if (tenantIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          tenant_id,
          status,
          created_at,
          profiles (name, email)
        `)
        .in("tenant_id", tenantIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRequests(data);
      }

      setLoading(false);
    };

    loadRequests();
  }, [user, isB2B, tenants, navigate]);

  const handleApprove = async (requestId: string) => {
    const { error } = await supabase
      .from("community_members")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", requestId);

    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from("community_members")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
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
          <h1 className="text-xl font-semibold">Solicitações de Acesso</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold">{request.profiles?.name || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {request.profiles?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Solicitado em: {formatDate(request.created_at)}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleApprove(request.id)}
                  >
                    <Check className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}