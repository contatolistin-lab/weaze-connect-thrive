import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Mail } from "lucide-react";
import { useCommunity } from "@/lib/community-store";
import { AppShell } from "@/components/weaze/AppShell";

export const Route = createFileRoute("/b2c/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — WEAZE" }] }),
  component: B2CProfile,
});

function B2CProfile() {
  const nav = useNavigate();
  const { auth, userType } = useCommunity();

  return (
    <AppShell title="Meu Perfil">
      <div className="px-4 pt-4 pb-24 space-y-6">
        <div className="flex items-center gap-4">
          <span className="shrink-0 h-16 w-16 rounded-full bg-brand-gradient grid place-items-center text-white text-xl font-extrabold">
            {auth.user?.name?.charAt(0).toUpperCase() || "U"}
          </span>
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
          <h2 className="text-sm font-extrabold tracking-tight mb-4">Conta</h2>
          <button
            onClick={() => {
              auth.logout();
              userType.setB2B(false);
              nav({ to: "/" });
            }}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-border text-[#d81e62] font-bold hover:bg-muted transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </section>
      </div>
    </AppShell>
  );
}
