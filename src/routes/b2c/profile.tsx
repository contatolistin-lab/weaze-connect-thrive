import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Mail, Camera, Headset, MessageSquare, Lightbulb, Bug } from "lucide-react";
import { useCommunity } from "@/lib/community-store";
import { AppShell } from "@/components/weaze/AppShell";
import { Avatar } from "@/components/weaze/Avatar";
import { WButton } from "@/components/weaze/WButton";
import { SupportRequestModal } from "@/components/weaze/SupportRequestModal";
import { SupportType } from "@/hooks/useSupportMessages";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/b2c/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — WEAZE" }] }),
  component: B2CProfile,
});

function B2CProfile() {
  const nav = useNavigate();
  const { auth, userType, community, profileAvatar, setProfileAvatar } = useCommunity();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string | undefined>(profileAvatar);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportType, setSupportType] = useState<SupportType>("duvida");

  useEffect(() => {
    setAvatar(profileAvatar);
  }, [profileAvatar]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      setProfileAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppShell title="Meu Perfil">
      <div className="px-4 pt-4 pb-24 space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0 group"
          >
            <Avatar name={auth.user?.name || "U"} size={64} src={avatar} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight truncate">
              {auth.user?.name || "Usuário"}
            </h1>
            <p className="text-sm text-foreground/60 truncate">{auth.user?.email || ""}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-5 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold tracking-tight">Dados da conta</h2>
          <div className="flex items-center gap-3">
            <User size={18} className="text-foreground/40 shrink-0" />
            <span className="text-sm">{auth.user?.name || "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-foreground/40 shrink-0" />
            <span className="text-sm">{auth.user?.email || "—"}</span>
          </div>
        </div>

        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Headset className="w-5 h-5" />
            <h2 className="text-sm font-extrabold tracking-tight">Central de Atendimento</h2>
          </div>
          <p className="text-xs text-foreground/60">Entre em contato com a equipe da comunidade.</p>
          <div className="grid gap-2">
            <button
              onClick={() => { setSupportType("duvida"); setSupportOpen(true); }}
              className="w-full flex items-center gap-3 h-auto py-3 px-4 rounded-xl border border-border bg-white hover:bg-muted transition-colors text-left"
            >
              <MessageSquare className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="text-sm font-bold">Enviar Dúvida</span>
            </button>
            <button
              onClick={() => { setSupportType("sugestao"); setSupportOpen(true); }}
              className="w-full flex items-center gap-3 h-auto py-3 px-4 rounded-xl border border-border bg-white hover:bg-muted transition-colors text-left"
            >
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm font-bold">Enviar Sugestão</span>
            </button>
            <button
              onClick={() => { setSupportType("problema"); setSupportOpen(true); }}
              className="w-full flex items-center gap-3 h-auto py-3 px-4 rounded-xl border border-border bg-white hover:bg-muted transition-colors text-left"
            >
              <Bug className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-bold">Reportar Problema</span>
            </button>
          </div>
        </section>

        <SupportRequestModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          communityId={community.name || "default"}
          userId={auth.user?.email || "unknown"}
          userName={auth.user?.name || "Usuário"}
          userEmail={auth.user?.email || ""}
          defaultType={supportType}
        />

        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-4">Conta</h2>
          <button
            onClick={() => {
              auth.logout();
              userType.setB2B(false);
              nav({ to: "/" });
            }}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-border text-[#000000] font-bold hover:bg-muted transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </section>
      </div>
    </AppShell>
  );
}
