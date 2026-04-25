import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type CtaType = "none" | "buy" | "schedule" | "quote" | "register" | "info";

const REGISTER_FIELDS = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "notes", label: "Observação", required: false },
  { key: "custom", label: "Campo personalizado", required: false },
];

export default function CreatePost() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const nav = useNavigate();

  const [type, setType] = useState<"video" | "image" | "text">("video");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [desc, setDesc] = useState("");

  const [ctaType, setCtaType] = useState<CtaType>("none");
  const [ctaLabel, setCtaLabel] = useState("");

  // BUY
  const [buyTitle, setBuyTitle] = useState("");
  const [buyDesc, setBuyDesc] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyUrl, setBuyUrl] = useState("");

  // SCHEDULE
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");

  // REGISTER
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [registerFields, setRegisterFields] = useState<string[]>(["name", "phone"]);
  const [customFieldLabel, setCustomFieldLabel] = useState("");

  // INFO
  const [infoMode, setInfoMode] = useState<"internal" | "external">("internal");
  const [infoContent, setInfoContent] = useState("");
  const [infoUrl, setInfoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ posts: number; max: number } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const [{ count: c }, { data: tp }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("tenant_plans").select("plan_id, plans(max_posts)").eq("tenant_id", tenant.id).maybeSingle(),
      ]);
      const max = (tp as any)?.plans?.max_posts ?? 100;
      setUsage({ posts: c ?? 0, max });
      const [{ data: svc }, { data: ev }] = await Promise.all([
        supabase.from("services").select("id, name").eq("tenant_id", tenant.id),
        supabase.from("events").select("id, title").eq("tenant_id", tenant.id),
      ]);
      setServices(svc ?? []);
      setEvents(ev ?? []);
    })();
  }, [tenant?.id]);

  const toggleField = (key: string) => {
    setRegisterFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const buildCtaConfig = (): { ok: boolean; config?: any; error?: string } => {
    if (ctaType === "buy") {
      if (!buyTitle.trim()) return { ok: false, error: "Título obrigatório" };
      if (!buyUrl.trim()) return { ok: false, error: "Link de checkout obrigatório" };
      if (/wa\.me|whatsapp/i.test(buyUrl)) return { ok: false, error: "Links de WhatsApp não são permitidos" };
      try { new URL(buyUrl); } catch { return { ok: false, error: "URL de checkout inválida" }; }
      return {
        ok: true,
        config: {
          title: buyTitle.trim(),
          description: buyDesc.trim() || undefined,
          price: buyPrice ? Number(buyPrice) : undefined,
          checkout_url: buyUrl.trim(),
        },
      };
    }
    if (ctaType === "schedule") {
      if (!serviceId) return { ok: false, error: "Selecione um serviço" };
      return { ok: true, config: { service_id: serviceId } };
    }
    if (ctaType === "quote") return { ok: true, config: {} };
    if (ctaType === "register") {
      if (!eventId) return { ok: false, error: "Selecione um evento" };
      if (registerFields.length === 0) return { ok: false, error: "Selecione ao menos um campo" };
      const fields = registerFields.map((k) => {
        if (k === "custom") return { key: "custom", label: customFieldLabel.trim() || "Campo extra", required: false };
        const f = REGISTER_FIELDS.find((x) => x.key === k)!;
        return { key: f.key, label: f.label, required: f.required };
      });
      return { ok: true, config: { event_id: eventId, fields } };
    }
    if (ctaType === "info") {
      if (infoMode === "external") {
        if (!infoUrl.trim()) return { ok: false, error: "URL obrigatória" };
        try { new URL(infoUrl); } catch { return { ok: false, error: "URL inválida" }; }
        return { ok: true, config: { type: "external", url: infoUrl.trim() } };
      }
      if (!infoContent.trim()) return { ok: false, error: "Conteúdo obrigatório" };
      return { ok: true, config: { type: "internal", content: infoContent.trim() } };
    }
    return { ok: true, config: {} };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;
    if (!isOwner) { toast.error("Apenas owners da marca podem postar"); return; }
    if (usage && usage.posts >= usage.max) { toast.error(`Limite do plano atingido (${usage.max} posts)`); return; }
    if (type !== "text" && !mediaUrl) { toast.error("URL de mídia obrigatória"); return; }

    let ctaConfig: any = null;
    if (ctaType !== "none") {
      const r = buildCtaConfig();
      if (!r.ok) { toast.error(r.error!); return; }
      ctaConfig = r.config;
    }

    setLoading(true);
    const { data: post, error } = await supabase.from("posts").insert({
      tenant_id: tenant.id, author_id: user.id, type,
      media_url: type === "text" ? null : mediaUrl,
      thumbnail_url: thumb || null,
      description: desc || null,
    }).select().single();
    if (error) { toast.error(error.message); setLoading(false); return; }

    if (ctaType !== "none") {
      const { error: ctaErr } = await supabase.from("post_cta").insert({
        post_id: post.id, type: ctaType, label: ctaLabel || "Saiba mais", config_json: ctaConfig,
      });
      if (ctaErr) { toast.error(`CTA: ${ctaErr.message}`); setLoading(false); return; }
    }

    toast.success("Post publicado");
    nav("/feed");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28">
        <h1 className="font-display text-3xl mb-1">Novo post</h1>
        {usage && <p className="text-xs text-muted-foreground mb-6">Uso: {usage.posts}/{usage.max} posts</p>}

        <form onSubmit={submit} className="space-y-5 bg-card p-5 rounded-2xl shadow-soft border border-border">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== "text" && (
            <>
              <div><Label>URL da mídia</Label><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" /></div>
              <div><Label>Thumbnail (opcional)</Label><Input value={thumb} onChange={(e) => setThumb(e.target.value)} /></div>
            </>
          )}
          <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} rows={3} /></div>

          <div className="border-t border-border pt-4">
            <Label>CTA (opcional)</Label>
            <Select value={ctaType} onValueChange={(v: any) => setCtaType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem CTA</SelectItem>
                <SelectItem value="buy">Comprar</SelectItem>
                <SelectItem value="schedule">Agendar</SelectItem>
                <SelectItem value="quote">Orçamento</SelectItem>
                <SelectItem value="register">Inscrição em evento</SelectItem>
                <SelectItem value="info">Saiba mais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ctaType !== "none" && (
            <div className="space-y-4 rounded-xl bg-secondary/40 p-4">
              <div>
                <Label>Texto do botão</Label>
                <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={40} placeholder="Ex: Comprar agora" />
              </div>

              {ctaType === "buy" && (
                <>
                  <div><Label>Título do produto</Label><Input value={buyTitle} onChange={(e) => setBuyTitle(e.target.value)} maxLength={120} /></div>
                  <div><Label>Descrição</Label><Textarea value={buyDesc} onChange={(e) => setBuyDesc(e.target.value)} maxLength={500} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Preço (R$)</Label><Input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} type="number" step="0.01" placeholder="99.90" /></div>
                    <div><Label>Link do checkout</Label><Input value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} placeholder="https://…" /></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Links de WhatsApp não são permitidos.</p>
                </>
              )}

              {ctaType === "schedule" && (
                <div>
                  <Label>Serviço</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {services.length === 0 && <p className="text-xs text-muted-foreground mt-2">Crie um serviço em Conteúdo → Serviços antes de usar.</p>}
                </div>
              )}

              {ctaType === "register" && (
                <>
                  <div>
                    <Label>Evento</Label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{events.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                    </Select>
                    {events.length === 0 && <p className="text-xs text-muted-foreground mt-2">Crie um evento em Conteúdo → Eventos.</p>}
                  </div>
                  <div>
                    <Label className="mb-2 block">Campos a coletar</Label>
                    <div className="space-y-2">
                      {REGISTER_FIELDS.map((f) => (
                        <label key={f.key} className="flex items-center gap-3 text-sm">
                          <Checkbox
                            checked={registerFields.includes(f.key) || f.required}
                            disabled={f.required}
                            onCheckedChange={() => !f.required && toggleField(f.key)}
                          />
                          <span>{f.label}{f.required && " (obrigatório)"}</span>
                        </label>
                      ))}
                    </div>
                    {registerFields.includes("custom") && (
                      <div className="mt-2"><Label>Rótulo do campo personalizado</Label>
                        <Input value={customFieldLabel} onChange={(e) => setCustomFieldLabel(e.target.value)} maxLength={40} placeholder="Ex: Empresa" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {ctaType === "info" && (
                <>
                  <div>
                    <Label>Tipo de info</Label>
                    <Select value={infoMode} onValueChange={(v: any) => setInfoMode(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Conteúdo interno (modal)</SelectItem>
                        <SelectItem value="external">Link externo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {infoMode === "internal" ? (
                    <div><Label>Conteúdo</Label><Textarea value={infoContent} onChange={(e) => setInfoContent(e.target.value)} rows={4} maxLength={2000} /></div>
                  ) : (
                    <div><Label>URL</Label><Input value={infoUrl} onChange={(e) => setInfoUrl(e.target.value)} placeholder="https://…" /></div>
                  )}
                </>
              )}

              {ctaType === "quote" && <p className="text-xs text-muted-foreground">Sem configuração adicional. O usuário envia um pedido de orçamento.</p>}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (usage ? usage.posts >= usage.max : false)}
            className="w-full bg-brand text-primary-foreground hover:opacity-90"
          >
            {loading ? "Publicando…" : "Publicar"}
          </Button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
