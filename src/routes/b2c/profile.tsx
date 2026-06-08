import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Mail, Camera, HelpCircle, Lightbulb, Bug, ChevronRight } from "lucide-react";
import { useCommunity } from "@/lib/community-store";
import { AppShell } from "@/components/weaze/AppShell";
import { Avatar } from "@/components/weaze/Avatar";
import { SupportRequestModal } from "@/components/weaze/SupportRequestModal";
import type { SupportType } from "@/lib/support-store";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/b2c/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — WEAZE" }] }),
  component: B2CProfile,
});

function B2CProfile() {
  const nav = useNavigate();
  const { auth, userType, profileAvatar, setProfileAvatar } = useCommunity();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string | undefined>(profileAvatar);
  const [supportType, setSupportType] = useState<SupportType | null>(null);


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

        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-1">Central de Atendimento</h2>
          <p className="text-xs text-foreground/60 mb-4">
            Fale com a equipe da comunidade. Sua mensagem será respondida em breve.
          </p>
          <ul className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {([
              { type: "duvida" as const, icon: HelpCircle, label: "Enviar Dúvida", emoji: "📩" },
              { type: "sugestao" as const, icon: Lightbulb, label: "Enviar Sugestão", emoji: "💡" },
              { type: "problema" as const, icon: Bug, label: "Reportar Problema", emoji: "🐞" },
            ]).map((opt) => (
              <li key={opt.type}>
                <button
                  onClick={() => setSupportType(opt.type)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted text-left"
                >
                  <span className="h-9 w-9 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center">
                    <opt.icon size={18} />
                  </span>
                  <span className="flex-1 text-sm font-semibold">
                    <span className="mr-2">{opt.emoji}</span>
                    {opt.label}
                  </span>
                  <ChevronRight size={18} className="text-foreground/40" />
                </button>
              </li>
            ))}
          </ul>
        </section>

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

      <SupportRequestModal
        open={supportType !== null}
        type={supportType}
        onClose={() => setSupportType(null)}
      />
    </AppShell>
  );
}
