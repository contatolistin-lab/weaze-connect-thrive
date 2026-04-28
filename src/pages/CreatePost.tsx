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

type CtaType = "none" | "buy" | "schedule" | "quote" | "register" | "info";

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
const IMAGE_ASPECT_RATIO = "1:1";

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
  };

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
          toast.warning("Imagem recomendada 1:1 (quadrado)");
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
    if (type !== "text" && !mediaUrl && !file) { toast.error("Adicione uma mídia (URL ou upload)"); return; }
    if (type !== "text" && mediaMode === "upload" && !file) { toast.error("Selecione um arquivo para upload"); return; }

    let ctaConfig: any = null;
    if (ctaType !== "none") {
      const r = buildCtaConfig();
      if (!r.ok) { toast.error(r.error!); return; }
      ctaConfig = r.config;
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
                      <p>• Proporção recomendada: 1:1 (quadrado)</p>
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
                        <img src={URL.createObjectURL(file)} className="w-full aspect-square object-cover" alt="Preview" />
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
