import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Lock,
  Globe,
  HelpCircle,
  LogOut,
  User,
  CreditCard,
  Palette,
} from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — WEAZE" }] }),
  component: Settings,
});

const groups = [
  {
    title: "Conta",
    items: [
      { icon: User, label: "Editar perfil" },
      { icon: Lock, label: "Privacidade e segurança" },
      { icon: CreditCard, label: "Pagamentos" },
    ],
  },
  {
    title: "Preferências",
    items: [
      { icon: Bell, label: "Notificações" },
      { icon: Globe, label: "Idioma" },
      { icon: Palette, label: "Aparência" },
    ],
  },
  { title: "Suporte", items: [{ icon: HelpCircle, label: "Central de ajuda" }] },
];

function Settings() {
  const nav = useNavigate();
  return (
    <div className="min-h-dvh bg-surface-muted">
      <div className="mx-auto max-w-md min-h-dvh bg-surface-muted">
        <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
          <div className="flex items-center gap-3 px-3 h-14">
            <button
              onClick={() => nav({ to: "/profile" })}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold">Configurações</h1>
          </div>
        </header>

        <div className="p-4 space-y-5">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 px-1">
                {g.title}
              </h2>
              <ul className="rounded-2xl bg-white border border-border overflow-hidden divide-y divide-border">
                {g.items.map((i) => (
                  <li key={i.label}>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5">
                      <span className="h-9 w-9 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center">
                        <i.icon size={16} />
                      </span>
                      <span className="flex-1 text-left text-sm font-semibold">{i.label}</span>
                      <ChevronRight size={18} className="text-foreground/40" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-border text-[#630091] font-bold"
          >
            <LogOut size={18} /> Sair
          </Link>

          <div className="pt-4 flex flex-col items-center gap-2 text-xs text-foreground/50">
            <WeazeLogo size="sm" />
            <p>WEAZE v1.0 · 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
