import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon, Video, Sparkles, Link2 } from "lucide-react";
import { WButton } from "@/components/weaze/WButton";
import { useState } from "react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Criar post — WEAZE" }] }),
  component: Create,
});

function Create() {
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [ctaName, setCtaName] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => nav({ to: "/feed" }), 700);
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
            <h1 className="font-bold">Novo post</h1>
            <WButton size="sm" variant="gradient" onClick={submit} loading={loading}>
              Publicar
            </WButton>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="aspect-[9/14] rounded-3xl bg-brand-gradient-soft border border-dashed border-[#d81e62]/40 grid place-items-center text-center p-6">
            <div>
              <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
                <Sparkles size={22} />
              </span>
              <p className="mt-3 font-bold">Adicione mídia</p>
              <p className="text-xs text-foreground/60">Vídeo vertical, foto ou texto</p>
              <div className="mt-4 flex justify-center gap-2">
                <WButton variant="white" size="sm">
                  <Video size={14} /> Vídeo
                </WButton>
                <WButton variant="white" size="sm">
                  <ImageIcon size={14} /> Foto
                </WButton>
              </div>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva uma legenda..."
            rows={3}
            className="w-full rounded-2xl border border-border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
          />

          <div className="rounded-2xl bg-white border border-border divide-y divide-border">
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                CTA (opcional)
              </p>
              <div className="space-y-2">
                <input
                  value={ctaName}
                  onChange={(e) => setCtaName(e.target.value)}
                  placeholder="Nome do botão (ex: Comprar agora)"
                  className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
                />
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 h-10">
                  <Link2 size={16} className="text-foreground/40" />
                  <input
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
            </div>
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
      </div>
    </div>
  );
}
