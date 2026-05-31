import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Home } from "lucide-react";
import { WButton } from "@/components/weaze/WButton";

export const Route = createFileRoute("/c/$slug")({
  head: () => ({ meta: [{ title: "Comunidade — WEAZE" }] }),
  component: CommunityInvite,
});

function CommunityInvite() {
  const { slug } = Route.useParams();
  const nav = useNavigate();

  let community: { name: string; description: string } | null = null;
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("weaze_community_invites");
      if (raw) {
        const map = JSON.parse(raw);
        community = map[slug] ?? null;
      }
    }
  } catch {}

  if (!community) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-extrabold">Link inválido</h1>
          <p className="text-sm text-foreground/60">Este link de comunidade não existe ou expirou.</p>
          <WButton variant="gradient" onClick={() => nav({ to: "/" })}>
            <Home size={16} /> Ir para o Início
          </WButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="h-20 w-20 mx-auto rounded-full bg-brand-gradient grid place-items-center text-white text-3xl font-extrabold">
          {community.name.charAt(0).toUpperCase()}
        </div>

        <h1 className="text-2xl font-extrabold">
          Bem-vindo à comunidade {community.name}!
        </h1>

        {community.description && (
          <p className="text-sm text-foreground/60 leading-relaxed">
            {community.description}
          </p>
        )}

        <div className="bg-brand-gradient-soft rounded-2xl p-4">
          <p className="text-sm text-foreground/80 font-semibold">
            Para acessar basta clicar abaixo.
          </p>
        </div>

        <WButton
          variant="gradient"
          fullWidth
          onClick={() => nav({ to: "/feed" })}
        >
          <ArrowRight size={18} /> Acessar
        </WButton>

        <button
          onClick={() => nav({ to: "/" })}
          className="text-sm text-foreground/50 font-semibold underline"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
