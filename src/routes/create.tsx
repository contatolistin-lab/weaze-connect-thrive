import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Link2,
  Upload,
  Youtube,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { WButton } from "@/components/weaze/WButton";
import { useState, useRef, useEffect } from "react";
import { addUserPost } from "@/lib/mock-data";
import { toast } from "sonner";
import { useCommunity } from "@/lib/community-store";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Criar postagem — WEAZE" }] }),
  component: CreateGuard,
});

function CreateGuard() {
  const { userType, hydrated } = useCommunity();
  const nav = useNavigate();

  useEffect(() => {
    if (hydrated && !userType.isB2B) {
      nav({ to: "/feed", replace: true });
    }
  }, [hydrated, userType.isB2B, nav]);

  if (!hydrated || !userType.isB2B) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-[#630091] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <Create />;
}

type MediaTab = "upload" | "link";

function Create() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mediaTab, setMediaTab] = useState<MediaTab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [fileType, setFileType] = useState<"image" | "video" | "">("");

  const [externalLink, setExternalLink] = useState("");
  const [externalPreview, setExternalPreview] = useState("");
  const [externalId, setExternalId] = useState("");

  const [description, setDescription] = useState("");
  const [ctaName, setCtaName] = useState("");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaLink, setCtaLink] = useState("");
  const [title, setTitle] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
    setFileType(f.type.startsWith("video/") ? "video" : "image");
    setExternalLink("");
    setExternalPreview("");
    setExternalId("");
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview("");
    setFileType("");
    if (filePreview) URL.revokeObjectURL(filePreview);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleExternalLink = (url: string) => {
    setExternalLink(url);
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (ytMatch) {
      const id = ytMatch[1];
      setExternalId(id);
      setExternalPreview(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
    } else if (vimeoMatch) {
      setExternalId(vimeoMatch[1]);
      setExternalPreview("");
    } else {
      setExternalId("");
      setExternalPreview("");
    }
  };

  const clearExternal = () => {
    setExternalLink("");
    setExternalPreview("");
    setExternalId("");
  };

  const hasMedia = !!filePreview || !!externalPreview || !!externalLink;
  const canPublish = hasMedia || description.trim().length > 0;

  const submit = () => {
    if (!canPublish || loading) return;
    setLoading(true);

    const community = {
      id: "default",
      name: title || "WEAZE",
      handle: "@weaze",
      description: "",
      members: 0,
      category: "",
      color: "",
      cover: "W",
      verified: true,
    };
    const id = "user_" + Date.now();

    const colors = [
      "from-purple-500 via-pink-500 to-rose-600",
      "from-sky-500 via-indigo-500 to-purple-600",
      "from-emerald-500 via-teal-500 to-cyan-600",
      "from-orange-500 via-red-500 to-pink-600",
      "from-blue-500 via-violet-500 to-fuchsia-600",
    ];

    addUserPost({
      id,
      community,
      caption: description,
      cta: ctaName || undefined,
      ctaLink: ctaLink || undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      mediaColor: colors[Math.floor(Math.random() * colors.length)],
      emoji: fileType === "video" ? "🎬" : externalLink ? "🔗" : "✨",
      mediaType: fileType ? (fileType as "image" | "video") : externalLink ? "external" : undefined,
      mediaUrl: filePreview || externalLink || undefined,
      mediaPreview: externalPreview || undefined,
      commentsEnabled,
    });

    setTimeout(() => nav({ to: "/feed" }), 400);
  };

  const mediaPanel = (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["upload", "link"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setMediaTab(tab);
              if (tab === "upload") clearExternal();
              if (tab === "link") clearFile();
            }}
            className={`flex-1 h-10 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mediaTab === tab
                ? "bg-brand-gradient text-white shadow-brand"
                : "bg-muted text-foreground/70"
            }`}
          >
            {tab === "upload" ? <Upload size={16} /> : <Link2 size={16} />}
            {tab === "upload" ? "Upload" : "Link externo"}
          </button>
        ))}
      </div>

      {mediaTab === "upload" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            className="hidden"
          />

          {filePreview ? (
            <div className="relative aspect-[9/14] rounded-3xl overflow-hidden bg-black shadow-brand">
              {fileType === "video" ? (
                <video
                  src={filePreview}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
              )}
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur grid place-items-center text-white"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-xs font-semibold">
                {fileType === "video" ? <Video size={14} /> : <ImageIcon size={14} />}
                {file?.name ?? "Mídia"}
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[9/14] rounded-3xl bg-brand-gradient-soft border-2 border-dashed border-[#630091]/40 grid place-items-center text-center p-6 hover:border-[#630091]/80 transition-colors"
            >
              <div>
                <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
                  <Upload size={26} />
                </span>
                <p className="mt-4 font-bold text-base">Adicionar mídia</p>
                <p className="mt-1 text-sm text-foreground/60">
                  Toque para selecionar imagem ou vídeo
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-white border border-border text-sm font-semibold">
                    <ImageIcon size={14} /> Foto
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-white border border-border text-sm font-semibold">
                    <Video size={14} /> Vídeo
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {mediaTab === "link" && (
        <div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
            <Link2 size={18} className="text-foreground/40 shrink-0" />
            <input
              value={externalLink}
              onChange={(e) => handleExternalLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {externalLink && (
              <button
                onClick={clearExternal}
                className="text-foreground/40 hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {externalPreview && (
            <div className="mt-3 relative aspect-video rounded-2xl overflow-hidden bg-black shadow-soft">
              <img
                src={externalPreview}
                alt="Video preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://img.youtube.com/vi/${externalId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 grid place-items-center">
                <span className="h-14 w-14 rounded-full bg-white/20 backdrop-blur grid place-items-center">
                  <Youtube size={28} className="text-white" />
                </span>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-xs font-semibold">
                <Video size={14} /> YouTube
              </div>
            </div>
          )}

          {!externalPreview && externalLink && (
            <div className="mt-3 aspect-video rounded-2xl bg-brand-gradient-soft border border-dashed border-[#630091]/30 grid place-items-center text-center p-4">
              <div>
                <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white">
                  <Link2 size={20} />
                </span>
                <p className="mt-2 text-sm font-semibold">Link adicionado</p>
                <p className="text-xs text-foreground/60 truncate max-w-[260px] mx-auto">
                  {externalLink}
                </p>
              </div>
            </div>
          )}

          {!externalLink && (
            <div className="mt-3 rounded-2xl bg-brand-gradient-soft border border-dashed border-[#630091]/30 p-5 text-center">
              <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white">
                <Youtube size={20} />
              </span>
              <p className="mt-2 text-sm font-semibold">YouTube, Vimeo e mais</p>
              <p className="text-xs text-foreground/60">
                Cole o link do vídeo para gerar preview automático
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const formPanel = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
          Descrição
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Escreva a descrição da postagem..."
          rows={3}
          className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-[#630091] resize-none"
        />
      </div>

      <div className="rounded-2xl bg-white border border-border overflow-hidden shadow-soft">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            Título da postagem
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título da postagem..."
            className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#630091]"
          />
        </div>

        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            CTA — link do botão
          </p>
          <div className="space-y-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setCtaOpen(!ctaOpen)}
                className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#630091] flex items-center justify-between bg-white"
              >
                <span className={ctaName ? "text-foreground" : "text-foreground/40"}>
                  {ctaName || "Selecionar CTA"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-foreground/40 transition-transform ${ctaOpen ? "rotate-180" : ""}`}
                />
              </button>
              {ctaOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCtaOpen(false)}
                  />
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white rounded-xl border border-border shadow-soft overflow-y-auto max-h-60">
                    {[
                      "Saiba mais",
                      "Comprar",
                      "Agendar",
                      "Inscrever-se",
                      "Assistir",
                      "Orçamento",
                      "Baixar",
                      "Cadastrar",
                      "Participar",
                      "Acessar",
                      "Doar",
                      "Reservar",
                    ].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCtaName(ctaName === name ? "" : name);
                          setCtaOpen(false);
                        }}
                        className={`w-full px-4 h-10 text-sm text-left transition-colors font-semibold ${
                          ctaName === name
                            ? "bg-brand-gradient-soft text-[#630091]"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border px-3 h-10 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
              <Link2 size={16} className="text-foreground/40 shrink-0" />
              <input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
          {ctaName && ctaLink && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <Check size={14} />
              CTA configurado: "{ctaName}" → {ctaLink}
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">Permitir comentários</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCommentsEnabled(true)}
                className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${
                  commentsEnabled
                    ? "bg-brand-gradient text-white shadow-brand"
                    : "bg-muted text-foreground/50"
                }`}
              >
                Sim
              </button>
              <button
                onClick={() => setCommentsEnabled(false)}
                className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${
                  !commentsEnabled
                    ? "bg-brand-gradient text-white shadow-brand"
                    : "bg-muted text-foreground/50"
                }`}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-brand-gradient text-white p-5 shadow-brand">
        <p className="text-xs font-bold tracking-widest uppercase opacity-80">Preview</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-white/20 grid place-items-center text-lg font-bold">
            W
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{title || "WEAZE"}</p>
            <p className="text-xs opacity-80">agora</p>
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed opacity-90">
          {description || "Sua descrição aparecerá aqui..."}
        </p>
        {ctaName && ctaLink && (
          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center bg-white text-[#630091] font-bold rounded-2xl px-5 h-10 text-sm w-full"
          >
            {ctaName}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden min-h-dvh bg-background">
        <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
          <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
            <div className="flex items-center justify-between px-3 h-14">
              <button
                onClick={() => nav({ to: "/feed" })}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold">Criar postagem</h1>
              <WButton
                size="sm"
                variant="gradient"
                onClick={submit}
                loading={loading}
                disabled={!canPublish}
              >
                Publicar
              </WButton>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="p-4 space-y-4">
              {mediaPanel}
              {formPanel}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 min-h-dvh">
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-brand">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold">Criar postagem</h1>
              <WButton
                size="sm"
                variant="gradient"
                onClick={submit}
                loading={loading}
                disabled={!canPublish}
              >
                Publicar
              </WButton>
            </div>
            <div className="max-w-3xl">
              {formPanel}
            </div>
          </div>
          <div className="w-80 xl:w-96 shrink-0 overflow-y-auto scrollbar-brand space-y-4">
            {mediaPanel}
          </div>
        </div>
      </div>
    </>
  );
}
