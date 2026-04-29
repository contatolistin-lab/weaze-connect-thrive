import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
      window.open(c.checkout_url, "_blank", "noopener,noreferrer");
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
  const [contact, setContact] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const send = async () => {
    const parsed = quoteSchema.safeParse({ name, contact, content });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.from("quotes").insert({
      tenant_id: tenantId, user_id: user?.id ?? null, post_id: postId,
      customer_name: name.trim(), customer_contact: contact.trim(), content: content.trim(),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "quote" } });
    toast.success("Solicitacao enviada");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle>
          <DialogDescription>Conte o que voce precisa. Retornamos em breve.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="q-name">Nome</Label><Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="q-contact">Contato (email ou telefone)</Label><Input id="q-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} /></div>
          <div><Label htmlFor="q-content">Mensagem</Label><Textarea id="q-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} rows={4} /></div>
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={send} disabled={loading}>
            {loading ? "Enviando…" : "Enviar"}
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
  const eventId: string | undefined = c.event_id;
  const fields: { key: string; label: string; required: boolean }[] =
    Array.isArray(c.fields) && c.fields.length > 0
      ? c.fields
      : [{ key: "name", label: "Nome", required: true }];

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setVal = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const send = async () => {
    if (!eventId) { toast.error("Evento nao configurado"); return; }
    for (const f of fields) {
      if (f.required && !(values[f.key] ?? "").trim()) {
        toast.error(`Campo obrigatorio: ${f.label}`); return;
      }
    }
    setLoading(true);
    const [{ data: ev }, { count }] = await Promise.all([
      supabase.from("events").select("capacity_limit").eq("id", eventId).maybeSingle(),
      supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    ]);
    if (ev?.capacity_limit && (count ?? 0) >= ev.capacity_limit) {
      toast.error("Inscricoes esgotadas"); setLoading(false); return;
    }
    const payload: Record<string, string> = {};
    fields.forEach((f) => { payload[f.label] = (values[f.key] ?? "").trim(); });
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId, user_id: user?.id ?? null,
      payload_json: payload,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await track({ tenantId, postId, ctaId: cta.id, action: "conversion", metadata: { intent: "register", event_id: eventId } });
    toast.success("Inscricao confirmada");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{cta.label}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`r-${f.key}`}>{f.label}{f.required && " *"}</Label>
              {f.key === "notes" ? (
                <Textarea id={`r-${f.key}`} value={values[f.key] ?? ""} onChange={(e) => setVal(f.key, e.target.value)} maxLength={500} rows={3} />
              ) : (
                <Input
                  id={`r-${f.key}`}
                  type={f.key === "email" ? "email" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  maxLength={120}
                />
              )}
            </div>
          ))}
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={send} disabled={loading}>
            {loading ? "Inscrevendo…" : "Confirmar inscricao"}
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
      window.open(c.url, "_blank", "noopener,noreferrer");
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
      window.open(c.external_url, "_blank", "noopener,noreferrer");
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