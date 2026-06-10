import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Lock, UserPlus } from "lucide-react";
import { getGroupByInviteCode, joinGroup, isGroupMember } from "@/lib/mock-data";
import { GroupImage } from "@/lib/group-utils";
import { WButton } from "@/components/weaze/WButton";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/groups/invite/$code")({
  head: () => ({ meta: [{ title: "Convite — WEAZE" }] }),
  component: GroupInvite,
});

function GroupInvite() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const { hydrated } = useCommunity();
  const group = getGroupByInviteCode(code);
  if (group && typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("name");
    if (n) {
      group.name = n;
      group.description = p.get("desc") || group.description;
    }
    const urlImg = p.get("img");
    if (urlImg) {
      group.image = urlImg;
      localStorage.setItem("invite_img_" + code, urlImg);
    } else {
      const storedImg = localStorage.getItem("invite_img_" + code);
      if (storedImg) group.image = storedImg;
    }
  }

  useEffect(() => {
    if (!hydrated || !group) return;
    if (isGroupMember(group.id)) {
      nav({ to: "/groups/$id", params: { id: group.id }, replace: true });
    }
  }, [hydrated, group, nav]);

  if (!group) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-extrabold">Convite inválido</h1>
          <p className="text-sm text-foreground/60">Este link de convite não existe ou expirou.</p>
          <WButton variant="gradient" onClick={() => nav({ to: "/" })}>
            Página inicial
          </WButton>
        </div>
      </div>
    );
  }

  const handleAccept = () => {
    joinGroup(group.id);
    nav({ to: "/groups/$id", params: { id: group.id }, replace: true });
  };

  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6">
      <div className="max-w-sm w-full space-y-5 text-center">
        <GroupImage src={group.image} className="h-24 w-24 mx-auto rounded-full" />

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
