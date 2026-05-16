import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Users, Clock, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";

type PendingRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  profile_name?: string | null;
  profile_email?: string;
  tenant_name?: string;
};

type AppointmentRequest = {
  id: string;
  appointment_id: string;
  post_id: string;
  tenant_id: string;
  user_id: string;
  selected_time: string;
  message: string | null;
  status: string;
  created_at: string;
  profile_name?: string | null;
  profile_email?: string;
  service_name?: string;
  service_date?: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  priority: string;
  data: any;
  created_at: string;
  actor_id: string | null;
};

export default function Notifications() {
  const { user } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "all">("requests");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id, role")
        .eq("user_id", user.id);
      
      const ownerMems = (mems || []).filter(m => m.role === "owner" || m.role === "admin");
      const hasOwnership = ownerMems.length > 0;
      setIsOwner(hasOwnership);
      
      if (!hasOwnership) {
        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        setNotifications(notifs || []);
        setLoading(false);
        return;
      }
      
      const tenantIds = ownerMems.map(m => m.tenant_id);
      
      const { data: reqs, error: reqError } = await supabase
        .from("community_requests")
        .select("id, user_id, tenant_id, status, created_at")
        .in("tenant_id", tenantIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (reqError) {
        setRequests([]);
      } else if (reqs && reqs.length > 0) {
        const reqUserIds = reqs.map(r => r.user_id);
        const reqTenantIds = reqs.map(r => r.tenant_id);
        
        const [{ data: profiles }, { data: tenants }] = await Promise.all([
          supabase.from("profiles").select("user_id, name, email").in("user_id", reqUserIds),
          supabase.from("tenants").select("id, name").in("id", reqTenantIds),
        ]);
        
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
        const tenantMap: Record<string, any> = {};
        (tenants || []).forEach((t: any) => { tenantMap[t.id] = t; });
        
        const enriched = reqs.map(r => ({
          ...r,
          profile_name: profileMap[r.user_id]?.name || null,
          profile_email: profileMap[r.user_id]?.email || "",
          tenant_name: tenantMap[r.tenant_id]?.name || "",
        }));
        setRequests(enriched);
      } else {
        setRequests([]);
      }

      // Load appointments for B2B
      const { data: appts } = await supabase
        .from("appointment_requests")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });

      if (appts && appts.length > 0) {
        const apptUserIds = appts.map(a => a.user_id);
        const apptIds = appts.map(a => a.appointment_id);

        const [{ data: profiles }, { data: ctas }] = await Promise.all([
          supabase.from("profiles").select("user_id, name, email").in("user_id", apptUserIds),
          supabase.from("appointment_cta").select("id, service_name, service_date").in("id", apptIds),
        ]);

        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

        const ctaMap: Record<string, any> = {};
        (ctas || []).forEach((c: any) => { ctaMap[c.id] = c; });

        const enrichedAppts = appts.map(a => ({
          ...a,
          profile_name: profileMap[a.user_id]?.name || null,
          profile_email: profileMap[a.user_id]?.email || "",
          service_name: ctaMap[a.appointment_id]?.service_name || "Serviço",
          service_date: ctaMap[a.appointment_id]?.service_date || "",
        }));

        setAppointments(enrichedAppts);
      } else {
        setAppointments([]);
      }
      
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      
      setNotifications(notifs || []);
      setLoading(false);
    })();
  }, [user, tenants]);

  const handleApprove = async (request: PendingRequest) => {
    const { error } = await supabase.from("community_requests").update({ status: "approved" }).eq("id", request.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    
    await supabase.from("memberships").insert({ tenant_id: request.tenant_id, user_id: request.user_id, role: "member" });
    toast.success("Membro aprovado!");
    
    sessionStorage.setItem("just_joined_community", request.tenant_id);
    
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("community_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) { toast.error("Erro ao recusar"); return; }
    toast.success("Solicitação recusada");
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleApproveAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "approved" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    toast.success("Agendamento aprovado!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "approved" } : a));
  };

  const handleCompleteAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "completed" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao concluir"); return; }
    toast.success("Agendamento concluído!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "completed" } : a));
  };

  const handleCancelAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "cancelled" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao cancelar"); return; }
    toast.success("Agendamento cancelado!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "cancelled" } : a));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Notificações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
        {isOwner && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 text-sm font-medium ${activeTab === "requests" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
            >
              Solicitações
              {requests.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-sm font-medium ${activeTab === "all" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
            >
              Todas
            </button>
          </div>
        )}
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {activeTab === "requests" && isOwner ? (
          <div className="space-y-6">
            {/* Access Requests */}
            {requests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Solicitações de acesso</h3>
                {requests.map(r => (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <p className="font-semibold">{r.profile_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {r.profile_email || "-"}</p>
                      </div>
                    </div>
                    {r.tenant_name && <p className="text-sm text-purple-600 font-medium">Comunidade: {r.tenant_name}</p>}
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(r.created_at)}</div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 gap-2" onClick={() => handleApprove(r)}><Check className="h-4 w-4" />Aprovar</Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleReject(r.id)}><X className="h-4 w-4" />Recusar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Appointments */}
            {appointments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Agendamentos</h3>
                {appointments.map(a => (
                  <div key={a.id} className="bg-card border border-purple-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{a.service_name || "Serviço"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {a.selected_time} • {a.service_date ? new Date(a.service_date).toLocaleDateString("pt-BR") : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        a.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        a.status === "approved" ? "bg-green-100 text-green-700" :
                        a.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {a.status === "pending" ? "Pendente" :
                         a.status === "approved" ? "Aprovado" :
                         a.status === "completed" ? "Concluído" :
                         "Cancelado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-3 w-3" /> {a.profile_name || "Cliente"}</div>
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {a.profile_email || "-"}</div>
                    </div>
                    {a.message && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-sm">
                        <p className="text-muted-foreground">{a.message}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" /> {formatDate(a.created_at)}
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleApproveAppointment(a)}>
                          <Check className="h-4 w-4" />Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleCancelAppointment(a)}>
                          <X className="h-4 w-4" />Cancelar
                        </Button>
                      </div>
                    )}
                    {a.status === "approved" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="w-full gap-2" onClick={() => handleCompleteAppointment(a)}>
                          <Check className="h-4 w-4" />Concluir Agendamento
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {requests.length === 0 && appointments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : notifications.map(n => {
              const isJoinRequest = n.type === "join_request";
              const isTopicReply = n.type === "topic_reply";
              return (
              <div
                key={n.id}
                onClick={() => isTopicReply && n.data?.topic_id && navigate(`/conversas/${n.data.topic_id}`)}
                className={`bg-card border rounded-2xl p-4 ${isJoinRequest ? "border-purple-200" : isTopicReply ? "border-blue-200 hover:bg-blue-50 cursor-pointer" : "border-border"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isJoinRequest ? "bg-purple-100" : isTopicReply ? "bg-blue-100" : "bg-brand/10"}`}>
                    {isJoinRequest ? (
                      <Users className="h-4 w-4 text-purple-600" />
                    ) : isTopicReply ? (
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bell className="h-4 w-4 text-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    {isTopicReply && n.data?.topic_title && (
                      <p className="text-sm text-blue-700 font-medium mt-0.5">{n.data.topic_title}</p>
                    )}
                    {isTopicReply && n.data?.message_preview && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{n.data.message_preview}"</p>
                    )}
                    {n.data?.user_name && !isTopicReply && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">{n.data.user_name}</span> {n.data.user_email ? `(${n.data.user_email})` : ""}
                      </p>
                    )}
                    {n.data?.tenant_name && !isTopicReply && (
                      <p className="text-xs text-purple-600 mt-0.5">{n.data.tenant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}