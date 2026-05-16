import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Users, Clock, MessageSquare, Calendar, Trash2 } from "lucide-react";
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

type BudgetRequest = {
  id: string;
  tenant_id: string;
  post_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  profile_name?: string;
  profile_email?: string;
  post_title?: string;
};

type EventRegistration = {
  id: string;
  event_id: string;
  post_id: string;
  tenant_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  answers: any;
  status: string;
  created_at: string;
  event_name?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
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
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
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

      // Load budget requests for B2B
      const { data: budgets } = await supabase
        .from("budget_requests")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });

      if (budgets && budgets.length > 0) {
        const budgetUserIds = budgets.map(b => b.user_id);
        const budgetPostIds = budgets.map(b => b.post_id);

        const [{ data: profiles2 }, { data: posts }] = await Promise.all([
          supabase.from("profiles").select("user_id, name, email").in("user_id", budgetUserIds),
          supabase.from("posts").select("id, description").in("id", budgetPostIds),
        ]);

        const profileMap2: Record<string, any> = {};
        (profiles2 || []).forEach((p: any) => { profileMap2[p.user_id] = p; });

        const postMap: Record<string, any> = {};
        (posts || []).forEach((p: any) => { postMap[p.id] = p; });

        const enrichedBudgets = budgets.map(b => ({
          ...b,
          profile_name: profileMap2[b.user_id]?.name || b.name,
          profile_email: profileMap2[b.user_id]?.email || b.email,
          post_title: postMap[b.post_id]?.description?.substring(0, 50) || "Post",
        }));

        setBudgetRequests(enrichedBudgets);
      } else {
        setBudgetRequests([]);
      }

      // Load event registrations for B2B from config_json
      const { data: allCtas, error: ctasError } = await supabase
        .from("post_cta")
        .select("id, post_id, config_json, tenant_id, type");

      console.log("[Notifications] Error:", ctasError);
      console.log("[Notifications] All CTAs count:", allCtas?.length);
      
      const allRegistrations: any[] = [];
      
      if (allCtas && allCtas.length > 0) {
        for (const cta of allCtas) {
          // Skip if tenant not in our list
          if (tenantIds && tenantIds.length > 0 && !tenantIds.includes(cta.tenant_id)) {
            continue;
          }
          
          // Skip if not register type
          if (cta.type !== "register") continue;
          
          let configJson = cta.config_json;
          if (typeof configJson === "string") {
            try { configJson = JSON.parse(configJson); } catch { continue; }
          }
          
          if (!configJson) continue;
          
          const eventData = configJson.event_data;
          if (!eventData || !eventData.registrations) continue;
          
          console.log("[Notifications] Found register CTA:", cta.id, "registrations:", eventData.registrations.length);
          
          for (const reg of eventData.registrations) {
            allRegistrations.push({
              id: cta.id + "_" + (reg.user_id || Math.random()),
              post_id: cta.post_id,
              tenant_id: cta.tenant_id,
              user_id: reg.user_id,
              name: reg.user_name || "Participante",
              email: reg.user_email,
              phone: reg.user_phone,
              notes: reg.notes,
              answers: reg.custom_answers,
              created_at: reg.created_at,
              event_name: eventData.event_name || "Evento",
              event_date: eventData.event_date,
              event_time: eventData.event_time,
              location: eventData.location,
              status: "pending",
            });
          }
        }
      }
      
      console.log("[Notifications] Total event registrations found:", allRegistrations.length);
      setEventRegistrations(allRegistrations);
      
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

    // Send notification to B2C user
    const { data: cta } = await supabase.from("appointment_cta").select("service_name, service_date").eq("id", appt.appointment_id).maybeSingle();
    const serviceName = cta?.service_name || appt.service_name || "Serviço";
    const serviceDate = cta?.service_date || appt.service_date || "";

    const formattedDate = serviceDate ? new Date(serviceDate).toLocaleDateString("pt-BR") : "";

    await supabase.from("notifications").insert({
      tenant_id: appt.tenant_id,
      user_id: appt.user_id,
      type: "appointment_approved",
      title: "Agendamento aprovado!",
      content: `Seu agendamento para: ${serviceName} no dia ${formattedDate} às ${appt.selected_time} foi aprovado!`,
      link: "/feed",
    });

    toast.success("Agendamento aprovado!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "approved" } : a));
  };

  const handleCompleteAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "completed" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao concluir"); return; }

    // Send notification to B2C user
    const { data: cta } = await supabase.from("appointment_cta").select("service_name, service_date").eq("id", appt.appointment_id).maybeSingle();
    const serviceName = cta?.service_name || appt.service_name || "Serviço";
    const serviceDate = cta?.service_date || appt.service_date || "";

    const formattedDate = serviceDate ? new Date(serviceDate).toLocaleDateString("pt-BR") : "";

    await supabase.from("notifications").insert({
      tenant_id: appt.tenant_id,
      user_id: appt.user_id,
      type: "appointment_completed",
      title: "Agendamento concluído!",
      content: `Seu agendamento para: ${serviceName} no dia ${formattedDate} às ${appt.selected_time} foi concluído.`,
      link: "/feed",
    });

    toast.success("Agendamento concluído!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "completed" } : a));
  };

  const handleCancelAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "cancelled" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao cancelar"); return; }

    // Send notification to B2C user
    const { data: cta } = await supabase.from("appointment_cta").select("service_name, service_date").eq("id", appt.appointment_id).maybeSingle();
    const serviceName = cta?.service_name || appt.service_name || "Serviço";
    const serviceDate = cta?.service_date || appt.service_date || "";

    const formattedDate = serviceDate ? new Date(serviceDate).toLocaleDateString("pt-BR") : "";

    await supabase.from("notifications").insert({
      tenant_id: appt.tenant_id,
      user_id: appt.user_id,
      type: "appointment_cancelled",
      title: "Agendamento cancelado",
      content: `Seu agendamento para: ${serviceName} no dia ${formattedDate} às ${appt.selected_time} foi cancelado.`,
      link: "/feed",
    });

    toast.success("Agendamento cancelado!");
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "cancelled" } : a));
  };

  const handleContactBudget = async (budget: BudgetRequest) => {
    const { error } = await supabase.from("budget_requests").update({ status: "contacted" }).eq("id", budget.id);
    if (error) { toast.error("Erro ao atualizar"); return; }

    await supabase.from("notifications").insert({
      tenant_id: budget.tenant_id,
      user_id: budget.user_id,
      type: "budget_contacted",
      title: "Estamos entrando em contato",
      content: "Estamos entrando em contato com você.",
      link: "/feed",
    });

    toast.success("Marcado como contactado!");
    setBudgetRequests(prev => prev.map(b => b.id === budget.id ? { ...b, status: "contacted" } : b));
  };

  const handleCompleteBudget = async (budget: BudgetRequest) => {
    const { error } = await supabase.from("budget_requests").update({ status: "completed" }).eq("id", budget.id);
    if (error) { toast.error("Erro ao concluir"); return; }

    await supabase.from("notifications").insert({
      tenant_id: budget.tenant_id,
      user_id: budget.user_id,
      type: "budget_completed",
      title: "Solicitação concluída",
      content: "Sua solicitação foi concluída.",
      link: "/feed",
    });

    toast.success("Orçamento concluído!");
    setBudgetRequests(prev => prev.map(b => b.id === budget.id ? { ...b, status: "completed" } : b));
  };

  const handleCancelBudget = async (budget: BudgetRequest) => {
    const { error } = await supabase.from("budget_requests").update({ status: "cancelled" }).eq("id", budget.id);
    if (error) { toast.error("Erro ao cancelar"); return; }

    await supabase.from("notifications").insert({
      tenant_id: budget.tenant_id,
      user_id: budget.user_id,
      type: "budget_cancelled",
      title: "Solicitação encerrada",
      content: "Sua solicitação foi encerrada.",
      link: "/feed",
    });

    toast.success("Orçamento cancelado!");
    setBudgetRequests(prev => prev.map(b => b.id === budget.id ? { ...b, status: "cancelled" } : b));
  };

  const handleConfirmEventRegistration = async (registration: EventRegistration) => {
    await supabase.from("notifications").insert({
      tenant_id: registration.tenant_id,
      user_id: registration.user_id,
      type: "event_registration_confirmed",
      title: "Inscrição confirmada",
      content: `Sua inscrição no evento "${registration.event_name}" foi confirmada!`,
      link: "/feed",
    });

    toast.success("Inscrição confirmada!");
    setEventRegistrations(prev => prev.map(r => r.id === registration.id ? { ...r, status: "confirmed" } : r));
  };

  const handleCancelEventRegistration = async (registration: EventRegistration) => {
    await supabase.from("notifications").insert({
      tenant_id: registration.tenant_id,
      user_id: registration.user_id,
      type: "event_registration_cancelled",
      title: "Inscrição cancelada",
      content: `Sua inscrição no evento "${registration.event_name}" foi cancelada.`,
      link: "/feed",
    });

    toast.success("Inscrição cancelada!");
    setEventRegistrations(prev => prev.map(r => r.id === registration.id ? { ...r, status: "cancelled" } : r));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const handleDeleteNotification = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Notificação excluída");
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleDeleteRequest = async (requestId: string) => {
    const { error } = await supabase.from("community_requests").delete().eq("id", requestId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Solicitação excluída");
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const { error } = await supabase.from("appointment_requests").delete().eq("id", appointmentId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Agendamento excluído");
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const { error } = await supabase.from("budget_requests").delete().eq("id", budgetId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Orçamento excluído");
    setBudgetRequests(prev => prev.filter(b => b.id !== budgetId));
  };

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
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 p-1" onClick={() => handleDeleteRequest(r.id)}><Trash2 className="h-4 w-4" /></Button>
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
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleCompleteAppointment(a)}>
                          <Check className="h-4 w-4" />Concluir Agendamento
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 p-1" onClick={() => handleDeleteAppointment(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {a.status !== "approved" && a.status !== "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 w-full" onClick={() => handleDeleteAppointment(a.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Budget Requests */}
            {budgetRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Orçamentos</h3>
                {budgetRequests.map(b => (
                  <div key={b.id} className="bg-card border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{b.name || "Cliente"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {b.email || "-"}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        b.status === "contacted" ? "bg-green-100 text-green-700" :
                        b.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {b.status === "pending" ? "Pendente" :
                         b.status === "contacted" ? "Contatado" :
                         b.status === "completed" ? "Concluído" :
                         "Cancelado"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Post: {b.post_title}</p>
                      {b.phone && <p className="text-xs">Telefone: {b.phone}</p>}
                    </div>
                    {b.message && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-sm">
                        <p className="text-muted-foreground">{b.message}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" /> {formatDate(b.created_at)}
                    </div>
                    {b.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleContactBudget(b)}>
                          <Check className="h-4 w-4" />Contatar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleCancelBudget(b)}>
                          <X className="h-4 w-4" />Cancelar
                        </Button>
                      </div>
                    )}
                    {b.status === "contacted" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleCompleteBudget(b)}>
                          <Check className="h-4 w-4" />Concluir Orçamento
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 p-1" onClick={() => handleDeleteBudget(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {b.status === "completed" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 w-full" onClick={() => handleDeleteBudget(b.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Event Registrations */}
            {eventRegistrations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Inscrições em Eventos</h3>
                {eventRegistrations.map(r => {
                  const answers = typeof r.answers === 'object' ? r.answers : {};
                  const answerKeys = Object.keys(answers).filter(k => !['Nome', 'Telefone', 'Email', 'Observação'].includes(k));
                  return (
                  <div key={r.id} className="bg-card border border-green-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{r.event_name || "Evento"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.event_date ? new Date(r.event_date).toLocaleDateString("pt-BR") : ""} {r.event_time ? `• ${r.event_time}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        r.status === "confirmed" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.status === "pending" ? "Pendente" :
                         r.status === "confirmed" ? "Confirmado" :
                         "Cancelado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-3 w-3" /> {r.name || "Participante"}</div>
                      {r.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {r.email}</div>}
                      {r.phone && <div className="flex items-center gap-1"><span className="text-xs">📱</span> {r.phone}</div>}
                    </div>
                    {answerKeys.length > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-sm space-y-1">
                        {answerKeys.map((key) => (
                          <p key={key} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{key}:</span> {answers[key]}
                          </p>
                        ))}
                      </div>
                    )}
                    {r.notes && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-sm">
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" /> {formatDate(r.created_at)}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleConfirmEventRegistration(r)}>
                          <Check className="h-4 w-4" />Confirmar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleCancelEventRegistration(r)}>
                          <X className="h-4 w-4" />Cancelar
                        </Button>
                      </div>
                    )}
                    {r.status === "confirmed" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleCancelEventRegistration(r)}>
                          <X className="h-4 w-4" />Cancelar Inscrição
                        </Button>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}

            {/* Empty state */}
            {requests.length === 0 && appointments.length === 0 && budgetRequests.length === 0 && eventRegistrations.length === 0 && (
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
            ) : [...notifications].reverse().map(n => {
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
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}
                    className="text-muted-foreground hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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