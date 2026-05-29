import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Sparkles,
  Link2,
  Upload,
  Youtube,
  X,
  Check,
  Music2,
} from "lucide-react";
import { WButton } from "@/components/weaze/WButton";
import { useState, useRef } from "react";
import { communities, addUserPost } from "@/lib/mock-data";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Criar postagem — WEAZE" }] }),
  component: Create,
});

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
  const [ctaLink, setCtaLink] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(communities[0].id);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
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
  const canPublish =
    hasMedia || description.trim().length > 0;

  const submit = () => {
    if (!canPublish || loading) return;
    setLoading(true);

    const community = communities.find((c) => c.id === selectedCommunity) ?? communities[0];
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
      mediaType: fileType
        ? (fileType as "image" | "video")
        : externalLink
          ? "external"
          : undefined,
      mediaUrl: filePreview || externalLink || undefined,
      mediaPreview: externalPreview || undefined,
    });

    setTimeout(() => nav({ to: "/feed" }), 400);
  };

  return (
    <div className="min-h-dvh bg-background">
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
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
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
                    className="w-full aspect-[9/14] rounded-3xl bg-brand-gradient-soft border-2 border-dashed border-[#d81e62]/40 grid place-items-center text-center p-6 hover:border-[#d81e62]/80 transition-colors"
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
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#d81e62] transition-shadow">
                  <Link2 size={18} className="text-foreground/40 shrink-0" />
                  <input
                    value={externalLink}
                    onChange={(e) => handleExternalLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  {externalLink && (
                    <button onClick={clearExternal} className="text-foreground/40 hover:text-foreground">
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
                  <div className="mt-3 aspect-video rounded-2xl bg-brand-gradient-soft border border-dashed border-[#d81e62]/30 grid place-items-center text-center p-4">
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
                  <div className="mt-3 rounded-2xl bg-brand-gradient-soft border border-dashed border-[#d81e62]/30 p-5 text-center">
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

            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                Descrição
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escreva a descrição da postagem..."
                rows={3}
                className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none"
              />
            </div>

            <div className="rounded-2xl bg-white border border-border overflow-hidden shadow-soft">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="inline-grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
                    <Music2 size={16} />
                  </span>
                  <div>
                    <p className="font-bold text-sm">Comunidade</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {communities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCommunity(c.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
                        selectedCommunity === c.id
                          ? "bg-brand-gradient text-white border-transparent"
                          : "bg-white border-border text-foreground/70"
                      }`}
                    >
                      {c.cover} {c.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                  CTA — link do botão
                </p>
                <div className="space-y-2">
                  <input
                    value={ctaName}
                    onChange={(e) => setCtaName(e.target.value)}
                    placeholder="Nome do botão (ex: Entrar agora)"
                    className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
                  />
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 h-10 focus-within:ring-2 focus-within:ring-[#d81e62] transition-shadow">
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
                  <span className="text-sm">Visibilidade</span>
                  <span className="text-sm text-[#630091] font-semibold">Pública</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">Permitir comentários</span>
                  <span className="text-sm text-[#630091] font-semibold">Sim</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-gradient text-white p-5 shadow-brand">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Preview</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-white/20 grid place-items-center text-lg font-bold">
                  {communities.find((c) => c.id === selectedCommunity)?.cover ?? "W"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {communities.find((c) => c.id === selectedCommunity)?.name ?? "WEAZE"}
                  </p>
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
        </div>
      </div>
    </div>
  );
}
