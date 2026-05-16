import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { track } from "@/lib/tracking";
import { toast } from "sonner";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

type CTA = {
  id: string;
  type: "buy" | "schedule" | "quote" | "register" | "info" | "live";
  label: string;
  config_json: any;
};

export default function CTAButton({ cta, postId, tenantId, className }: { cta: CTA; postId: string; tenantId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const buttonLabel = cta.label?.trim() || "Ver mais";

  const handleClick = async () => {
    await track({ tenantId, postId, ctaId: cta.id, action: "click_cta" });
    setOpen(true);
  };

  return (
    <div className={cn("w-full", className)}>
      <Button
        onClick={handleClick}
        size="lg"
        className="feed-cta-button w-full min-h-12 rounded-xl px-5 text-base font-bold text-primary-foreground shadow-brand pointer-events-auto"
      >
        {buttonLabel}
      </Button>
      {open && <CTADialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CTADialog({ cta, postId, tenantId, open, onClose }: { cta: CTA; postId: string; tenantId: string; open: boolean; onClose: () => void }) {
  switch (cta.type) {
    case "buy": return <BuyDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
    case "schedule": return <ScheduleDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
    case "quote": return <QuoteDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
    case "register": return <RegisterDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
    case "info": return <InfoDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
    case "live": return <LiveDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
  }
}

/* ===================== BUY ===================== */
function BuyDialog({ cta, postId, tenantId, open, onClose }: any) {
  const c = cta.config_json ?? {};
  const go = async () => {
    if (c.checkout_url) {
      await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "buy" } });
      window.location.href = c.checkout_url;
    }
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{c.title ?? cta.label}</DialogTitle>
          {c.description && <DialogDescription className="text-pretty">{c.description}</DialogDescription>}
        </DialogHeader>
        {c.price !== undefined && (
          <p className="font-display text-4xl text-brand">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.price))}
          </p>
        )}
        <DialogFooter>
          <Button onClick={go} size="lg" className="w-full bg-brand text-primary-foreground hover:opacity-90">
            Continuar para o checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== SCHEDULE ===================== */
function ScheduleDialog({ cta, postId, tenantId, open, onClose }: any) {
  const { user } = useAuth();
  const c = cta.config_json ?? {};
  const isNewSystem = c?.type === "appointment" || c?.service_name;

  if (!isNewSystem) {
    return <LegacyScheduleDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
  }

  return <NewAppointmentDialog cta={cta} postId={postId} tenantId={tenantId} open={open} onClose={onClose} />;
}

function NewAppointmentDialog({ cta, postId, tenantId, open, onClose }: any) {
  const { user } = useAuth();
  const c = cta.config_json ?? {};
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  console.log("[NewAppointmentDialog] cta:", cta, "postId:", postId);

  useEffect(() => {
    if (!open || !postId) return;
    (async () => {
      const { data: appointmentCta } = await supabase
        .from("appointment_cta")
        .select("id")
        .eq("post_id", postId)
        .maybeSingle();

      if (!appointmentCta) return;

      const { data: approvedAppts } = await supabase
        .from("appointment_requests")
        .select("selected_time")
        .eq("appointment_id", appointmentCta.id)
        .eq("status", "approved");

      if (approvedAppts && approvedAppts.length > 0) {
        const times = approvedAppts.map((a: any) => a.selected_time);
        setBookedTimes(times);
      }
    })();
  }, [open, postId]);

  const allAvailableTimes: string[] = c.available_times ?? [];
  const availableTimes = allAvailableTimes.filter(t => !bookedTimes.includes(t));
  const serviceName = c.service_name ?? cta.label ?? "Serviço";
  const serviceDate = c.service_date ?? "";
  const duration = c.duration_minutes ?? 60;
  const notes = c.notes ?? "";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const confirm = async () => {
    if (!selectedTime || !user) return;
    setLoading(true);

    console.log("[Appointment] postId:", postId, "ctaId:", cta.id, "config:", c);

    let appointmentCtaId = null;

    // Try to find existing appointment_cta
    const { data: existingAppointment } = await supabase
      .from("appointment_cta")
      .select("id")
      .eq("post_id", postId)
      .maybeSingle();

    // If not found, create it based on config
    if (!existingAppointment && c?.service_name) {
      console.log("[Appointment] Creating new appointment_cta from config");
      const { data: newAppointment, error: createError } = await supabase
        .from("appointment_cta")
        .insert({
          post_id: postId,
          tenant_id: tenantId,
          service_name: c.service_name,
          duration_minutes: c.duration_minutes || 60,
          service_date: c.service_date,
          available_times: c.available_times || [],
          notes: c.notes || null,
          max_bookings: c.max_bookings || 1,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (createError) {
        console.log("[Appointment] Create error:", createError);
        toast.error("Erro ao criar agendamento");
        setLoading(false);
        return;
      }

      appointmentCtaId = newAppointment?.id;
    } else {
      appointmentCtaId = existingAppointment?.id;
    }

    if (!appointmentCtaId) {
      console.log("[Appointment] No appointment ID found");
      toast.error("Erro: agendamento não encontrado");
      setLoading(false);
      return;
    }

    console.log("[Appointment] Using appointment ID:", appointmentCtaId);

    const { error } = await supabase.from("appointment_requests").insert({
      appointment_id: appointmentCtaId,
      post_id: postId,
      tenant_id: tenantId,
      user_id: user.id,
      selected_time: selectedTime,
      message: message.trim() || null,
      status: "pending",
    });

    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Você já agendou neste horário");
      } else {
        toast.error(error.message);
      }
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.name || user.email?.split("@")[0] || "Usuário";

    await supabase.from("notifications").insert({
      tenant_id: tenantId,
      user_id: user.id,
      type: "appointment_pending",
      title: "Nova solicitação de agendamento",
      content: `${userName} solicitou agendamento para ${serviceName} às ${selectedTime}`,
      link: `/requests`,
    });

    const { data: owners } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "owner");

    if (owners && owners.length > 0) {
      for (const o of owners) {
        if (o.user_id !== user.id) {
          await supabase.from("notifications").insert({
            tenant_id: tenantId,
            user_id: o.user_id,
            type: "appointment_pending",
            title: "Nova solicitação de agendamento",
            content: `${userName} solicitou agendamento para ${serviceName} às ${selectedTime}`,
            link: `/requests`,
          });
        }
      }
    }

    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "schedule" } });
    setSubmitted(true);
    toast.success("Solicitação de agendamento enviada!");
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Agendamento Solicitado</DialogTitle>
            <DialogDescription>
              Sua solicitação foi enviada. Você será notificado quando for aprovada.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <p className="font-medium">{serviceName}</p>
            <p className="text-sm text-muted-foreground">{formatDate(serviceDate)} • {selectedTime} • {duration}min</p>
          </div>
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={onClose}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{serviceName}</DialogTitle>
          <DialogDescription>
            {formatDate(serviceDate)} • {duration}min
          </DialogDescription>
        </DialogHeader>

        {notes && (
          <div className="bg-secondary/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Observações:</p>
            <p className="text-muted-foreground">{notes}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Horários disponíveis:</p>
          {allAvailableTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horários disponíveis</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {allAvailableTimes.map((t) => {
                const isBooked = bookedTimes.includes(t);
                return (
                  <Button
                    key={t}
                    size="sm"
                    variant={selectedTime === t ? "default" : "outline"}
                    disabled={isBooked}
                    onClick={() => !isBooked && setSelectedTime(t)}
                    className={`${
                      selectedTime === t 
                        ? "bg-brand text-primary-foreground hover:opacity-90" 
                        : isBooked 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" 
                          : ""
                    }`}
                  >
                    {t}
                    {isBooked && " ✓"}
                  </Button>
                );
              })}
            </div>
          )}
          {bookedTimes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">✓ = já ocupado</p>
          )}
        </div>

        {selectedTime && (
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <Label htmlFor="ap-message">Observações (opcional)</Label>
              <Textarea
                id="ap-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Algo que precise informar..."
                maxLength={500}
                rows={2}
              />
            </div>
            <Button
              className="w-full bg-brand text-primary-foreground hover:opacity-90"
              onClick={confirm}
              disabled={loading}
            >
              {loading ? "Enviando…" : "Confirmar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LegacyScheduleDialog({ cta, postId, tenantId, open, onClose }: any) {
  const { user } = useAuth();
  const c = cta.config_json ?? {};
  const serviceId: string | undefined = c.service_id;
  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSlots = async (d: Date) => {
    if (!serviceId) return;
    setSlots([]); setSlot(null);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    const [{ data: rules }, { data: blocked }, { data: appts }, { data: svc }] = await Promise.all([
      supabase.from("availability_rules").select("*").eq("service_id", serviceId).eq("weekday", dow),
      supabase.from("blocked_dates").select("date").eq("service_id", serviceId).eq("date", iso),
      supabase.from("appointments").select("time").eq("service_id", serviceId).eq("date", iso),
      supabase.from("services").select("duration_minutes").eq("id", serviceId).maybeSingle(),
    ]);
    if (blocked && blocked.length > 0) return;
    const dur = svc?.duration_minutes ?? 60;
    const taken = new Set((appts ?? []).map((a: any) => a.time.slice(0, 5)));
    const out: string[] = [];
    for (const r of rules ?? []) {
      const [sh, sm] = r.start_time.split(":").map(Number);
      const [eh, em] = r.end_time.split(":").map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      while (cur + dur <= end) {
        const t = `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`;
        if (!taken.has(t)) out.push(t);
        cur += dur;
      }
    }
    setSlots(out);
  };

  const confirm = async () => {
    if (!date || !slot || !serviceId) return;
    if (name.trim().length < 2) { toast.error("Informe seu nome"); return; }
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenantId, service_id: serviceId, user_id: user?.id ?? null,
      date: date.toISOString().slice(0, 10), time: slot,
      customer_name: name.trim(), customer_phone: phone.trim() || null, notes: notes.trim() || null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "schedule" } });
    toast.success("Agendamento confirmado");
    onClose();
  };

  if (!serviceId) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indisponivel</DialogTitle>
            <DialogDescription>Esta agenda ainda nao foi configurada.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d); if (d) loadSlots(d); }}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            className={cn("p-3 pointer-events-auto rounded-md border")}
          />

          {date && (
            <div>
              <p className="text-sm font-medium mb-2">Horarios disponiveis</p>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem horarios nesse dia.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <Button
                      key={s} size="sm"
                      variant={slot === s ? "default" : "outline"}
                      onClick={() => setSlot(s)}
                      className={slot === s ? "bg-brand text-primary-foreground hover:opacity-90" : ""}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {slot && (
            <div className="space-y-3 border-t border-border pt-4">
              <div><Label htmlFor="ap-name">Nome</Label><Input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
              <div><Label htmlFor="ap-phone">Telefone</Label><Input id="ap-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
              <div><Label htmlFor="ap-notes">Observacao</Label><Textarea id="ap-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} /></div>
              <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={confirm} disabled={loading}>
                {loading ? "Confirmando…" : "Confirmar agendamento"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== QUOTE ===================== */
const quoteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(3).max(120),
  content: z.string().trim().min(5).max(1000),
});
function QuoteDialog({ cta, postId, tenantId, open, onClose }: any) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user || !open || profileLoaded) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile) {
        setName(profile.name || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
      }
      setProfileLoaded(true);
    })();
  }, [user, open, profileLoaded]);

  const send = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!message.trim()) { toast.error("Mensagem obrigatória"); return; }
    if (!user) return;
    
    setLoading(true);
    
    const { error } = await supabase.from("budget_requests").insert({
      tenant_id: tenantId,
      post_id: postId,
      user_id: user.id,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim(),
      status: "pending",
    });

    setLoading(false);
    
    if (error) {
      if (error.code === "23505") {
        toast.error("Você já enviou uma solicitação para este post");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Notify B2B owner
    const { data: owners } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "owner");

    if (owners && owners.length > 0) {
      for (const o of owners) {
        if (o.user_id !== user.id) {
          await supabase.from("notifications").insert({
            tenant_id: tenantId,
            user_id: o.user_id,
            type: "budget_pending",
            title: "Nova solicitação de orçamento",
            content: `${name.trim()} enviou uma solicitação de orçamento.\n\nServiço: ${cta.label || "Serviço"}\n\nMensagem: ${message.trim()}\n\nTelefone: ${phone.trim() || "Não informado"}`,
            link: "/notifications",
          });
        }
      }
    }

    // Notify B2C user
    await supabase.from("notifications").insert({
      tenant_id: tenantId,
      user_id: user.id,
      type: "budget_received",
      title: "Solicitação recebida",
      content: "Sua solicitação de orçamento foi recebida. Em breve entraremos em contato.",
      link: "/feed",
    });

    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "quote" } });
    toast.success("Solicitação enviada!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle>
          <DialogDescription>Conte rapidamente o que precisa. Entraremos em contato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="q-name">Nome</Label><Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Seu nome" /></div>
          <div><Label htmlFor="q-email">Email</Label><Input id="q-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder="seu@email.com" /></div>
          <div><Label htmlFor="q-phone">Telefone</Label><Input id="q-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(00)00000-0000" /></div>
          <div><Label htmlFor="q-message">Mensagem</Label><Textarea id="q-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} placeholder="Descreva o que você precisa..." /></div>
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={send} disabled={loading}>
            {loading ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== REGISTER (event) ===================== */
function RegisterDialog({ cta, postId, tenantId, open, onClose }: any) {
  const { user } = useAuth();
  const c = cta.config_json ?? {};
  const eventData = c.event_data ?? {};
  const fields: { key: string; label: string; required: boolean }[] =
    Array.isArray(c.fields) && c.fields.length > 0
      ? c.fields
      : [{ key: "name", label: "Nome", required: true }];
  const customFields = eventData.custom_fields ?? [];

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setVal = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  const formatTime = (t: string) => t || "";

  const send = async () => {
    for (const f of fields) {
      if (f.required && !(values[f.key] ?? "").trim()) {
        toast.error(`Campo obrigatório: ${f.label}`); return;
      }
    }
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user?.id)
      .maybeSingle();

    const userName = values.name || profile?.name || user?.email?.split("@")[0] || "Usuário";
    const now = new Date().toISOString();

    const registration = {
      user_id: user?.id,
      user_name: values.name || userName,
      user_email: values.email ?? null,
      user_phone: values.phone ?? null,
      notes: values.notes ?? null,
      custom_answers: customFields.reduce((acc: any, cf: any) => {
        if (values[cf.name]) acc[cf.name] = values[cf.name];
        return acc;
      }, {}),
      created_at: now,
    };

    const currentRegistrations = eventData.registrations ?? [];
    
    const existingReg = currentRegistrations.find((r: any) => r.user_id === user?.id);
    if (existingReg) {
      setLoading(false);
      toast.error("Você já está inscrito neste evento");
      return;
    }

    if (eventData.max_participants && currentRegistrations.length >= eventData.max_participants) {
      setLoading(false);
      toast.error("Inscrições esgotadas");
      return;
    }

    const newRegistrations = [...currentRegistrations, registration];
    const newEventData = { ...eventData, registrations: newRegistrations };

    const { error: updateError } = await supabase
      .from("post_cta")
      .update({ config_json: { ...c, event_data: newEventData } })
      .eq("post_id", postId)
      .eq("type", "register");

    setLoading(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    await supabase.from("notifications").insert({
      tenant_id: tenantId,
      user_id: user?.id,
      type: "event_registration_received",
      title: "Inscrição recebida",
      content: "Sua inscrição foi recebida. Em breve entraremos em contato.",
      link: "/feed",
    });

    const { data: owners } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "owner");

    if (owners && owners.length > 0) {
      let notificationContent = `Nova inscrição para: ${eventData.event_name}`;
      notificationContent += `\nNome: ${values.name || "-"}`;
      if (values.phone) notificationContent += `\nTelefone: ${values.phone}`;
      if (values.email) notificationContent += `\nEmail: ${values.email}`;
      
      customFields.forEach((cf: any) => {
        if (values[cf.name]) notificationContent += `\n${cf.name}: ${values[cf.name]}`;
      });

      for (const o of owners) {
        if (o.user_id !== user?.id) {
          await supabase.from("notifications").insert({
            tenant_id: tenantId,
            user_id: o.user_id,
            type: "event_registration_pending",
            title: "Nova inscrição recebida",
            content: notificationContent,
            link: "/notifications",
          });
        }
      }
    }

    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "register" } });
    toast.success("Inscrição recebida. Em breve entraremos em contato.");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{eventData.event_name || cta.label}</DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            {eventData.event_date && <p>{formatDate(eventData.event_date)} • {formatTime(eventData.event_time)}</p>}
            {eventData.location && <p>{eventData.location}</p>}
            {eventData.description && <p className="text-xs mt-2">{eventData.description}</p>}
          </div>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`r-${f.key}`}>{f.label}{f.required && " *"}</Label>
              {f.key === "notes" ? (
                <Textarea id={`r-${f.key}`} value={values[f.key] ?? ""} onChange={(e) => setVal(f.key, e.target.value)} maxLength={500} rows={3} />
              ) : (
                <Input
                  id={`r-${f.key}`}
                  type={f.key === "email" ? "email" : f.key === "phone" ? "tel" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  maxLength={120}
                />
              )}
            </div>
          ))}
          {customFields.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="text-sm font-medium">Informações adicionais</p>
              {customFields.map((cf: any, idx: number) => (
                <div key={idx}>
                  <Label htmlFor={`cf-${idx}`}>{cf.name}</Label>
                  <Input id={`cf-${idx}`} value={values[cf.name] ?? ""} onChange={(e) => setVal(cf.name, e.target.value)} maxLength={120} />
                </div>
              ))}
            </>
          )}
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={send} disabled={loading}>
            {loading ? "Inscrevendo…" : "Participar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== INFO ===================== */
function InfoDialog({ cta, postId, tenantId, open, onClose }: any) {
  const c = cta.config_json ?? {};
  const goExternal = async () => {
    if (c.url) {
      await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "info_external" } });
      window.location.href = c.url;
    }
    onClose();
  };
  
  if (c.type === "external" && c.url) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Voce sera redirecionado para um link externo.</p>
          <Button onClick={goExternal} className="w-full bg-brand text-primary-foreground hover:opacity-90">Ir para link</Button>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle></DialogHeader>
        <p className="text-pretty whitespace-pre-wrap text-sm">{c.content ?? "Sem conteudo."}</p>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== LIVE ===================== */
function LiveDialog({ cta, postId, tenantId, open, onClose }: any) {
  const c = cta.config_json ?? {};
  const goLive = async () => {
    if (c.external_url) {
      await track({ tenantId, postId, ctaId: cta.id, action: "click_cta", metadata: { intent: "live" } });
      window.location.href = c.external_url;
    }
    onClose();
  };

  const isScheduled = c.scheduled_at && new Date(c.scheduled_at) > new Date();
  const isLive = c.is_live;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                AO VIVO
              </span>
            ) : isScheduled ? (
              <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">AGENDADA</span>
            ) : null}
          </div>
          <DialogTitle className="font-display text-2xl">{c.title ?? cta.label}</DialogTitle>
          {c.description && <DialogDescription className="text-pretty">{c.description}</DialogDescription>}
        </DialogHeader>
        {isScheduled && (
          <p className="text-sm text-muted-foreground">
            Agendada para: {new Date(c.scheduled_at).toLocaleString("pt-BR")}
          </p>
        )}
        <DialogFooter>
          <Button
            onClick={goLive}
            size="lg"
            className={cn(
              "w-full min-h-12 text-base font-bold gap-2",
              isLive ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-brand hover:opacity-90"
            )}
          >
            <Play className="w-5 h-5" />
            {isLive ? "Entrar agora" : isScheduled ? "Verificar horario" : "Ver detalhes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}