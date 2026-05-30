import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Check } from "lucide-react";
import { getGroupByInviteCode, joinGroup, isGroupMember } from "@/lib/mock-data";

export const Route = createFileRoute("/groups/invite/$code")({
  head: () => ({ meta: [{ title: "Convite — WEAZE" }] }),
  component: GroupInvite,
});

function GroupInvite() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const group = getGroupByInviteCode(code);

  if (!group) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-extrabold">Convite inválido</h1>
          <p className="text-sm text-foreground/60">
            Este link de convite não existe ou expirou.
          </p>
          <Link
            to="/groups"
            className="inline-flex h-10 px-6 rounded-full bg-brand-gradient text-white text-sm font-bold items-center shadow-brand"
          >
            Ir para Grupos
          </Link>
        </div>
      </div>
    );
  }

  const alreadyMember = isGroupMember(group.id);

  const handleAccept = () => {
    if (!alreadyMember) {
      joinGroup(group.id);
    }
    setAccepted(true);
  };

  if (accepted || alreadyMember) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-extrabold">Bem-vindo ao grupo!</h1>
          <p className="text-sm text-foreground/60">
            Você agora faz parte de <strong>{group.name}</strong>.
          </p>
          <button
            onClick={() => nav({ to: "/groups" })}
            className="inline-flex h-10 px-6 rounded-full bg-brand-gradient text-white text-sm font-bold items-center shadow-brand"
          >
            Ir para Grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
      <div className="max-w-sm space-y-5">
        <div className="text-6xl">{group.emoji}</div>
        <h1 className="text-2xl font-extrabold">{group.name}</h1>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {group.topic}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-sm text-foreground/50">
          <Lock size={14} /> Grupo Privado
        </div>
        <p className="text-sm text-foreground/70 font-semibold">
          Você foi convidado para participar deste grupo privado.
        </p>
        <button
          onClick={handleAccept}
          className="w-full h-12 rounded-2xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-brand"
        >
          <Check size={18} /> Aceitar Convite
        </button>
        <Link
          to="/groups"
          className="block text-sm text-foreground/50 font-semibold underline"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
