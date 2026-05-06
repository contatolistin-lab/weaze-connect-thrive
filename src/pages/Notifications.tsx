import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getB2BNotifications, getB2CNotifications, approveAccess, rejectAccess, B2BNotification, B2CNotification } from "@/lib/communityAccess";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Clock, User, Mail, Building2, ArrowRight, Trash2 } from "lucide-react";

type TenantInfo = {
  id: string;
  name: string;
  slug: string;
};

export default function Notifications() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  
  const [b2bNotifications, setB2bNotifications] = useState<B2BNotification[]>([]);
  const [b2cNotifications, setB2cNotifications] = useState<B2CNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    console.log("=== NOTIFICATIONS DEBUG ===");
    console.log("User:", user.id);
    console.log("isB2B:", isB2B);
    console.log("Tenants do B2B:", tenants);

    if (isB2B) {
      // B2B: buscar notificações de TODOS os tenants que é dono
      let allNotifications: B2BNotification[] = [];
      
      if (tenants && tenants.length > 0) {
        // Buscar notificações para cada tenant
        tenants.forEach((t: TenantInfo) => {
          const notifications = getB2BNotifications(t.id);
          console.log(`Notificações para tenant ${t.name} (${t.id}):`, notifications);
          allNotifications = [...allNotifications, ...notifications];
        });
      } else {
        // Se não tem tenants, pode ser que esteja acessando uma comunidade específica
        console.log("B2B sem tenants carregados ainda");
      }
      
      // Ordenar por data (mais recente primeiro)
      allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log("Total de notificações B2B:", allNotifications);
      setB2bNotifications(allNotifications);
      
    } else if (user) {
      // B2C: buscar suas próprias notificações
      const notifications = getB2CNotifications(user.id);
      console.log("B2C Notifications para user:", user.id, notifications);
      setB2cNotifications(notifications);
    }
    
    setLoading(false);
  }, [user, isB2B, tenants, navigate]);

  const handleApprove = async (notification: B2BNotification) => {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", notification.tenantId)
      .maybeSingle();
    
    approveAccess(
      notification.slug, 
      notification.userId, 
      notification.tenantId, 
      tenantData?.name || "Comunidade"
    );
    
    setB2bNotifications(prev => prev.filter(n => n !== notification));
  };

  const handleReject = async (notification: B2BNotification) => {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", notification.tenantId)
      .maybeSingle();
    
    rejectAccess(
      notification.slug, 
      notification.userId, 
      notification.tenantId, 
      tenantData?.name || "Comunidade"
    );
    
    setB2bNotifications(prev => prev.filter(n => n !== notification));
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
                <p>Nenhuma solicitação pendente</p>
                <p className="text-sm mt-2">Todas as suas comunidades serão monitoradas</p>
              </div>
            ) : (
              b2bNotifications.map((notification, index) => (
                <div key={index} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-semibold">{notification.userName || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {notification.userEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Comunidade: {notification.slug}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(notification)}
                    >
                      <Check className="h-4 w-4 mr-2" /> Aprovar
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(notification)}
                    >
                      <X className="h-4 w-4 mr-2" /> Recusar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Suas notificações</h2>
            
            {b2cNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              b2cNotifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`border rounded-2xl p-4 space-y-3 ${
                    notification.type === "approved" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      notification.type === "approved" 
                        ? "bg-green-100" 
                        : "bg-red-100"
                    }`}>
                      {notification.type === "approved" ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {notification.type === "approved" ? "Acesso aprovado" : "Acesso recusado"}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{notification.tenantName}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </div>
                  
                  {notification.type === "approved" && (
                    <Button 
                      className="w-full bg-brand text-primary-foreground hover:opacity-90"
                      onClick={() => navigate(`/m/${notification.slug}`)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" /> Entrar na comunidade
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}