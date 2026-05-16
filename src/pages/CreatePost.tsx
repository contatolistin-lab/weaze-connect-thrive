import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Video, Image as ImageIcon, Link, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CtaType = "none" | "buy" | "schedule" | "quote" | "register" | "info" | "live";

const REGISTER_FIELDS = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "notes", label: "Observação", required: false },
  { key: "custom", label: "Campo personalizado", required: false },
];

const MAX_VIDEO_DURATION = 120; // 2 minutes in seconds
const VIDEO_ASPECT_RATIO = "9:16";
const VIDEO_RESOLUTION = "1080x1920";
const IMAGE_ASPECT_RATIO = "4:5";
const IMAGE_RESOLUTION = "1080x1350";

export default function CreatePost() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const nav = useNavigate();

  const [type, setType] = useState<"video" | "image" | "text">("video");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [desc, setDesc] = useState("");

  const [ctaType, setCtaType] = useState<CtaType>("none");

  // Default CTA labels
  const ctaLabels: Record<CtaType, string> = {
    none: "",
    buy: "Comprar",
    schedule: "Agendar",
    quote: "Solicitar Orçamento",
    register: "Inscrever-se",
    info: "Saiba mais",
    live: "Assistir Live",
  };

  // BUY
  const [buyTitle, setBuyTitle] = useState("");
  const [buyDesc, setBuyDesc] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyUrl, setBuyUrl] = useState("");

  // SCHEDULE - Appointments (new system)
  const [scheduleServiceName, setScheduleServiceName] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("60");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([]);
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleMaxBookings, setScheduleMaxBookings] = useState("1");

  // Legacy SCHEDULE (services)
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");

  // REGISTER - Event CTA
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState("");
  const [eventCustomFields, setEventCustomFields] = useState<{name: string; type: string}[]>([]);
  const [registerFields, setRegisterFields] = useState<string[]>(["name", "phone"]);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldType, setNewCustomFieldType] = useState("text");

  // INFO
  const [infoMode, setInfoMode] = useState<"internal" | "external">("internal");
  const [infoContent, setInfoContent] = useState("");
  const [infoUrl, setInfoUrl] = useState("");

  // LIVE
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDesc, setLiveDesc] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveScheduledAt, setLiveScheduledAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ posts: number; max: number } | null>(null);

  // File upload state
  const [mediaMode, setMediaMode] = useState<"url" | "upload">("url");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    // Validate video duration
    if (type === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`Vídeo deve ter no máximo ${MAX_VIDEO_DURATION / 60} minuto(s)`);
          return;
        }
        setFile(f);
      };
      video.src = URL.createObjectURL(f);
    } else if (type === "image") {
      // Validate image aspect ratio will be done on preview
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 1) > 0.1) { // Allow small tolerance
          toast.warning("Imagem recomendada 4:5 (vertical)");
        }
        setFile(f);
      };
      img.src = URL.createObjectURL(f);
    } else {
      setFile(f);
    }
  };

  const uploadFile = async (f: File): Promise<string> => {
    const ext = f.name.split(".").pop();
    const path = `${tenant!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("public").upload(path, f);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("public").getPublicUrl(path);
    return publicUrl;
  };

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const [{ count: c }, { data: tp }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("tenant_plans").select("plan_id, plans(max_posts)").eq("tenant_id", tenant.id).maybeSingle(),
      ]);
      const max = (tp as any)?.plans?.max_posts ?? 100;
      setUsage({ posts: c ?? 0, max });
      const [{ data: svc }] = await Promise.all([
        supabase.from("services").select("id, name").eq("tenant_id", tenant.id),
      ]);
      setServices(svc ?? []);
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
      const isNewSystem = scheduleServiceName.trim().length > 0;
      if (isNewSystem) {
        if (!scheduleServiceName.trim()) return { ok: false, error: "Nome do serviço obrigatório" };
        if (!scheduleDate) return { ok: false, error: "Data obrigatória" };
        if (scheduleTimes.length === 0) return { ok: false, error: "Selecione ao menos um horário" };
        return {
          ok: true,
          config: {
            type: "appointment",
            service_name: scheduleServiceName.trim(),
            duration_minutes: parseInt(scheduleDuration),
            service_date: scheduleDate,
            available_times: scheduleTimes,
            notes: scheduleNotes.trim() || undefined,
            max_bookings: parseInt(scheduleMaxBookings) || 1,
          },
        };
      }
      return { ok: true, config: { type: "legacy", service_id: serviceId } };
    }
    if (ctaType === "quote") return { ok: true, config: {} };
    if (ctaType === "register") {
      if (!eventName.trim()) return { ok: false, error: "Nome do evento obrigatório" };
      if (registerFields.length === 0) return { ok: false, error: "Selecione ao menos um campo" };
      const fields = registerFields.map((k) => {
        if (k === "custom") return { key: "custom", label: customFieldLabel.trim() || "Campo extra", required: false };
        const f = REGISTER_FIELDS.find((x) => x.key === k)!;
        return { key: f.key, label: f.label, required: f.required };
      });
      return { ok: true, config: { 
        fields, 
        event_data: { 
          event_name: eventName.trim(), 
          description: eventDescription.trim() || null, 
          event_date: eventDate || null, 
          event_time: eventTime || null, 
          location: eventLocation.trim() || null, 
          max_participants: eventMaxParticipants ? parseInt(eventMaxParticipants) : null, 
          custom_fields: eventCustomFields,
          registrations: [] 
        } 
      } };
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
    if (ctaType === "live") {
      if (!liveTitle.trim()) return { ok: false, error: "Título da LIVE obrigatório" };
      if (!liveUrl.trim()) return { ok: false, error: "Link da transmissão obrigatório" };
      try { new URL(liveUrl); } catch { return { ok: false, error: "Link inválido" }; }
      return {
        ok: true,
        config: {
          title: liveTitle.trim(),
          description: liveDesc.trim() || undefined,
          external_url: liveUrl.trim(),
          scheduled_at: liveScheduledAt || null,
          is_live: false,
        },
      };
    }
    return { ok: true, config: {} };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("SUBMIT - tenant:", !!tenant, "user:", !!user, "type:", type, "mediaUrl:", !!mediaUrl, "file:", !!file);
    if (!tenant) { toast.error("Tenant não carregou. Recarregue a página."); return; }
    if (!user) { toast.error("Você precisa estar logado."); return; }
    if (type !== "text" && !mediaUrl && !file) { toast.error("Adicione uma mídia (URL ou upload)"); return; }
    if (type !== "text" && mediaMode === "upload" && !file) { toast.error("Selecione um arquivo para upload"); return; }

    let ctaConfig: any = null;
    let ctaEventData: any = null;
    if (ctaType !== "none") {
      if (ctaType === "live" && !isOwner) { toast.error("Apenas proprietários podem criar lives"); return; }
      const r = buildCtaConfig();
      if (!r.ok) { toast.error(r.error!); return; }
      ctaConfig = r.config;
      ctaEventData = (r as any).eventData;
    }

    setLoading(true);

    // Upload file if in upload mode
    let finalMediaUrl = mediaUrl;
    let finalThumb = thumb;
    
    if (mediaMode === "upload" && file) {
      try {
        finalMediaUrl = await uploadFile(file);
        // For images, use same URL as thumbnail
        if (type === "image") finalThumb = finalMediaUrl;
      } catch (err: any) {
        toast.error(`Upload falhou: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    const { data: post, error } = await supabase.from("posts").insert({
      tenant_id: tenant.id, author_id: user.id, type,
      media_url: type === "text" ? null : finalMediaUrl,
      thumbnail_url: (type === "video" && finalThumb) || (type === "image" ? finalThumb : null),
      description: desc || null,
    }).select().single();
    if (error) { console.error("Post insert error:", error); toast.error(error.message); setLoading(false); return; }
    console.log("Post created:", post);

if (ctaType !== "none") {
      const { error: ctaErr } = await supabase.from("post_cta").insert({
        post_id: post.id, type: ctaType, label: ctaLabels[ctaType], config_json: ctaConfig,
      });
      if (ctaErr) { toast.error(`CTA: ${ctaErr.message}`); setLoading(false); return; }

      // Create live if CTA is "live"
      if (ctaType === "live") {
        const { error: liveErr } = await supabase.from("lives").insert({
          tenant_id: tenant.id,
          title: liveTitle,
          description: liveDesc,
          external_url: liveUrl,
          scheduled_at: liveScheduledAt ? new Date(liveScheduledAt).toISOString() : null,
          created_by: user.id,
        });
        if (liveErr) { toast.error(`Live: ${liveErr.message}`); setLoading(false); return; }
      }

      // Create appointment CTA if type is "schedule" with new system
      if (ctaType === "schedule" && ctaConfig?.type === "appointment") {
        console.log("[CreatePost] Creating appointment_cta with config:", ctaConfig);
        const { data: appointmentData, error: appointmentErr } = await supabase.from("appointment_cta").insert({
          post_id: post.id,
          tenant_id: tenant.id,
          service_name: ctaConfig.service_name,
          duration_minutes: ctaConfig.duration_minutes,
          service_date: ctaConfig.service_date,
          available_times: ctaConfig.available_times,
          notes: ctaConfig.notes,
          max_bookings: ctaConfig.max_bookings,
          created_by: user.id,
        }).select();
        console.log("[CreatePost] appointment_cta result:", appointmentData, "error:", appointmentErr);
        if (appointmentErr) { toast.error(`Agendamento: ${appointmentErr.message}`); setLoading(false); return; }
      }

      // Event data is now stored directly in config_json
    }

    toast.success("Post publicado");
    // Navigate with timestamp to force refresh
    nav(`/feed?t=${Date.now()}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
<TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28">
        <h1 className="font-display text-3xl mb-1">Novo post</h1>
        {usage && <p className="text-xs text-muted-foreground mb-4">Uso: {usage.posts}/{usage.max} posts</p>}
 
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
              {/* Media Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMediaMode("url")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                    mediaMode === "url" ? "bg-brand/10 border-brand" : "bg-card border-border hover:bg-secondary/50"
                  )}
                >
                  <Link className={cn("h-6 w-6", mediaMode === "url" ? "text-brand" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-semibold", mediaMode === "url" ? "text-brand" : "text-muted-foreground")}>URL</span>
                  <span className="text-xs text-muted-foreground px-2 text-center">Vimeo, Cloudinary, etc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode("upload")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                    mediaMode === "upload" ? "bg-brand/10 border-brand" : "bg-card border-border hover:bg-secondary/50"
                  )}
                >
                  <Upload className={cn("h-6 w-6", mediaMode === "upload" ? "text-brand" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-semibold", mediaMode === "upload" ? "text-brand" : "text-muted-foreground")}>Upload</span>
                  <span className="text-xs text-muted-foreground px-2 text-center">Enviar arquivo</span>
                </button>
              </div>

              {mediaMode === "url" ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-base font-medium">
                      {type === "video" ? "URL do vídeo" : "URL da imagem"}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {type === "video" ? "Cole a URL do seu vídeo (Vimeo, Cloudinary, etc)" : "Cole a URL da imagem"}
                    </p>
                  </div>
                  <Input 
                    value={mediaUrl} 
                    onChange={(e) => setMediaUrl(e.target.value)} 
                    placeholder={type === "video" ? "https://player.vimeo.com/..." : "https://exemplo.com/imagem.jpg"}
                    className="h-12"
                  />
                  {type === "video" && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Especificações técnicas:</p>
                      <p>• Proporção: 9:16 (vertical)</p>
                      <p>• Duração máxima: 2 minutos</p>
                      <p>• Resolução recomendada: 1080x1920px</p>
                    </div>
                  )}
                  {type === "image" && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                      <p>• Proporção recomendada: 4:5 (1080x1350px)</p>
                      <p>• Formatos aceitos: JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={type === "video" ? "video/*" : "image/*"}
                    className="hidden"
                  />
                  {file ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 rounded-full"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {type === "video" ? (
                        <video src={URL.createObjectURL(file)} className="w-full aspect-[9/16]" controls />
                      ) : (
                        <img src={URL.createObjectURL(file)} className="w-full aspect-[4/5] object-cover" alt="Preview" />
                      )}
                      <p className="p-2 text-xs text-muted-foreground bg-card">
                        {file.name}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-12 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-3 hover:bg-secondary/40 transition-all"
                    >
                      {type === "video" ? (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-medium">Clique para carregar</p>
                        <p className="text-xs text-muted-foreground">
                          {type === "video" 
                            ? `Vídeo ${VIDEO_ASPECT_RATIO} • até ${MAX_VIDEO_DURATION / 60} min` 
                            : `Imagem ${IMAGE_ASPECT_RATIO}`}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Thumbnail for video URL mode */}
              {mediaMode === "url" && type === "video" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Thumbnail (opcional)</Label>
                  <p className="text-xs text-muted-foreground">Imagem de capa do vídeo - será gerada automaticamente se vazio</p>
                  <Input value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="https://exemplo.com/thumbnail.jpg" />
                </div>
              )}
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
                {isOwner && <SelectItem value="live">Ao Vivo (LIVE)</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {ctaType !== "none" && (
            <div className="space-y-4 rounded-xl bg-secondary/40 p-4">
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
                <div className="space-y-3">
                  {services.length > 0 && (
                    <div>
                      <Label>Serviço (legado)</Label>
                      <Select value={serviceId} onValueChange={setServiceId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {services.length > 0 && <p className="text-xs text-muted-foreground mt-1">Ou use o sistema de agendamento abaixo</p>}
                    </div>
                  )}
                  <hr className="my-2" />
                  <div><Label>Serviço</Label><Input value={scheduleServiceName} onChange={(e) => setScheduleServiceName(e.target.value)} placeholder="Ex: Limpeza de carro" maxLength={100} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Duração</Label>
                      <Select value={scheduleDuration} onValueChange={setScheduleDuration}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">1h</SelectItem>
                          <SelectItem value="90">1h30</SelectItem>
                          <SelectItem value="120">2h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Data</Label><Input value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} type="date" /></div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Horários disponíveis</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((t) => (
                        <label key={t} className="flex items-center gap-1 text-sm border rounded p-2 cursor-pointer hover:bg-secondary">
                          <Checkbox checked={scheduleTimes.includes(t)} onCheckedChange={(c) => { if (c) setScheduleTimes([...scheduleTimes, t]); else setScheduleTimes(scheduleTimes.filter(x => x !== t)); }} />
                          <span>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="Ex: Chegar 10 minutos antes" rows={2} maxLength={300} /></div>
                  <div><Label>Qtd. máxima de agendamentos</Label><Input value={scheduleMaxBookings} onChange={(e) => setScheduleMaxBookings(e.target.value)} type="number" min="1" max="100" className="w-24" /></div>
                </div>
              )}

              {ctaType === "register" && (
                <div className="space-y-4">
                  <div><Label>Nome do evento</Label><Input value={eventName} onChange={(e) => setEventName(e.target.value)} maxLength={120} placeholder="Workshop de Marketing" /></div>
                  <div><Label>Descrição do evento</Label><Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Descreva rapidamente o evento" rows={2} maxLength={500} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input value={eventDate} onChange={(e) => setEventDate(e.target.value)} type="date" /></div>
                    <div><Label>Horário</Label><Input value={eventTime} onChange={(e) => setEventTime(e.target.value)} type="time" /></div>
                  </div>
                  <div><Label>Local</Label><Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Online, Auditório, Link Zoom, Rua..." /></div>
                  <div><Label>Limite de participantes</Label><Input value={eventMaxParticipants} onChange={(e) => setEventMaxParticipants(e.target.value)} type="number" min="1" placeholder="50" className="w-32" /></div>
                  
                  <div>
                    <Label className="mb-2 block">Campos a coletar</Label>
                    <div className="space-y-2">
                      {REGISTER_FIELDS.map((f) => (
                        <label key={f.key} className="flex items-center gap-3 text-sm">
                          <Checkbox checked={registerFields.includes(f.key) || f.required} disabled={f.required} onCheckedChange={() => !f.required && toggleField(f.key)} />
                          <span>{f.label}{f.required && " (obrigatório)"}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Campos extras personalizados</Label>
                    <p className="text-xs text-muted-foreground mb-2">Adicione informações adicionais que deseja solicitar dos participantes.</p>
                    <div className="space-y-2">
                      {eventCustomFields.map((field, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium">{field.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{field.type}</span>
                            <button type="button" onClick={() => setEventCustomFields(eventCustomFields.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomFieldModal(true)} className="w-full">+ Adicionar campo</Button>
                    </div>
                  </div>

                  {showCustomFieldModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-background rounded-xl p-4 w-80 space-y-3">
                        <h3 className="font-semibold">Novo campo</h3>
                        <div><Label>Nome do campo</Label><Input value={newCustomFieldName} onChange={(e) => setNewCustomFieldName(e.target.value)} placeholder="Profissão, Instagram, Cidade..." /></div>
                        <div><Label>Tipo</Label>
                          <Select value={newCustomFieldType} onValueChange={setNewCustomFieldType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="select">Seleção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => { if (newCustomFieldName.trim()) { setEventCustomFields([...eventCustomFields, { name: newCustomFieldName.trim(), type: newCustomFieldType }]); setNewCustomFieldName(""); setShowCustomFieldModal(false); } }} className="flex-1">Salvar</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowCustomFieldModal(false)} className="flex-1">Cancelar</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

              {ctaType === "live" && (
                <>
                  <div><Label>Título da LIVE</Label><Input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} maxLength={120} placeholder="Ex: Ao vivo com o especialista" /></div>
                  <div><Label>Descrição</Label><Textarea value={liveDesc} onChange={(e) => setLiveDesc(e.target.value)} maxLength={500} rows={2} placeholder="Sobre o que será a live..." /></div>
                  <div><Label>Link da transmissão</Label><Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://meet.google.com/..., https://youtube.com/..." /></div>
                  <div><Label>Agendar (opcional)</Label><Input value={liveScheduledAt} onChange={(e) => setLiveScheduledAt(e.target.value)} type="datetime-local" /></div>
                  <p className="text-xs text-muted-foreground">Agende ou publique imediatamente. Voce controlara o status "AO VIVO" manualmente.</p>
                </>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
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
