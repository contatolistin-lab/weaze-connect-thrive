import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, UserPlus, Check, ArrowRight } from "lucide-react";
import { getGroupByInviteCode, joinGroup, isGroupMember } from "@/lib/mock-data";
import { WButton } from "@/components/weaze/WButton";

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
          <p className="text-sm text-foreground/60">Este link de convite não existe ou expirou.</p>
          <WButton variant="gradient" onClick={() => nav({ to: "/groups" })}>
            Ir para Grupos
          </WButton>
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
        <div className="max-w-sm space-y-4">
          <div className="text-6xl">{group.image}</div>
          <h1 className="text-2xl font-extrabold">{group.name}</h1>
          <p className="text-sm text-foreground/60">
            {alreadyMember
              ? `Você já faz parte de ${group.name}.`
              : `Você agora faz parte de ${group.name}!`}
          </p>
          <WButton
            variant="gradient"
            onClick={() => nav({ to: "/groups/$id", params: { id: group.id } })}
            fullWidth
          >
            <ArrowRight size={16} /> Ir para o Grupo
          </WButton>
          <button
            onClick={() => nav({ to: "/groups" })}
            className="text-sm text-foreground/50 font-semibold underline"
          >
            Voltar para Grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6">
      <div className="max-w-sm w-full space-y-5 text-center">
        <div className="text-6xl">{group.image}</div>

        <h1 className="text-2xl font-extrabold">{group.name}</h1>
        <p className="text-sm text-foreground/60 leading-relaxed">{group.description}</p>

        <div className="flex items-center justify-center gap-1.5 text-sm text-foreground/50">
          <Lock size={14} />
          <span>Grupo Privado</span>
          <span>·</span>
          <span>{group.memberCount} membros</span>
        </div>

        <div className="bg-brand-gradient-soft rounded-2xl p-4">
          <p className="text-sm text-foreground/80 font-semibold">
            Você foi convidado para participar deste grupo privado.
          </p>
        </div>

        <WButton variant="gradient" onClick={handleAccept} fullWidth>
          <UserPlus size={18} /> Aceitar Convite
        </WButton>

        <button
          onClick={() => nav({ to: "/groups" })}
          className="text-sm text-foreground/50 font-semibold underline"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
