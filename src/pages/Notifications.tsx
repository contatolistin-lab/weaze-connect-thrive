import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail } from "lucide-react";
import { toast } from "sonner";

type PendingRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  profiles?: { name: string | null; email: string };
  tenants?: { name: string };
};

export default function Notifications() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user || !isB2B) { setLoading(false); return; }
    
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);
    
    if (!mems || mems.length === 0) { setLoading(false); return; }
    
    const tenantIds = mems.map(m => m.tenant_id);
    
    const { data } = await supabase
      .from("community_requests")
      .select("*, profiles(name, email), tenants(name)")
      .in("tenant_id", tenantIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [user, isB2B]);

  const handleApprove = async (request: PendingRequest) => {
    const { error } = await supabase.from("community_requests").update({ status: "approved" }).eq("id", request.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    
    await supabase.from("memberships").insert({ tenant_id: request.tenant_id, user_id: request.user_id, role: "member" });
    toast.success("Membro aprovado!");
    loadRequests();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("community_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) { toast.error("Erro ao recusar"); return; }
    toast.success("Solicitação recusada");
    loadRequests();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Notificações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {isB2B ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Solicitações de acesso</h2>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação de acesso no momento</p>
              </div>
            ) : requests.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold">{r.profiles?.name || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {r.profiles?.email || "-"}</p>
                  </div>
                </div>
                {r.tenants && <p className="text-sm text-purple-600 font-medium">Comunidade: {r.tenants.name}</p>}
                <div className="text-xs text-muted-foreground">Solicitado em: {formatDate(r.created_at)}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 gap-2" onClick={() => handleApprove(r)}><Check className="h-4 w-4" />Aprovar</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleReject(r.id)}><X className="h-4 w-4" />Recusar</Button>
                </div>
              </div>
            ))}
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