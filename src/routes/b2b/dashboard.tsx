import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  Plus,
  BarChart3,
  Radio,
  MessageSquare,
  Settings,
} from "lucide-react";
import { WButton } from "@/components/weaze/WButton";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";

export const Route = createFileRoute("/b2b/dashboard")({
  head: () => ({ meta: [{ title: "WEAZE for Brands — Painel" }] }),
  component: B2BDashboard,
});

function B2BDashboard() {
  return (
    <div className="min-h-dvh bg-surface-muted">
      <div className="mx-auto max-w-md min-h-dvh bg-surface-muted pb-8">
        {/* Top */}
        <header className="bg-brand-gradient text-white px-5 pt-5 pb-8 rounded-b-3xl shadow-brand">
          <div className="flex items-center justify-between">
            <WeazeLogo size="sm" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest bg-white/15 px-2 py-1 rounded-full">
                FOR BRANDS
              </span>
              <Link
                to="/settings"
                className="h-9 w-9 grid place-items-center rounded-full bg-white/15"
              >
                <Settings size={16} />
              </Link>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="h-14 w-14 rounded-2xl bg-white text-[#630091] grid place-items-center font-extrabold text-2xl">
              N
            </span>
            <div>
              <p className="text-xs opacity-80">Comunidade</p>
              <h1 className="text-xl font-extrabold tracking-tight">Nike Run Club</h1>
            </div>
          </div>
        </header>

        {/* Empty-feed callout for fresh communities */}
        <div className="mx-4 -mt-5 rounded-3xl bg-white shadow-soft p-4 flex items-center gap-3 border border-border">
          <div className="h-10 w-10 rounded-2xl bg-brand-gradient text-white grid place-items-center">
            <Plus size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Faça sua primeira postagem</p>
            <p className="text-xs text-foreground/60">Comece a engajar sua comunidade.</p>
          </div>
          <Link to="/create">
            <WButton variant="gradient" size="sm">
              Postar
            </WButton>
          </Link>
        </div>

        {/* KPIs */}
        <section className="px-4 mt-5">
          <h2 className="text-sm font-bold text-foreground/60 uppercase tracking-wider">
            Visão geral
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: "Membros", value: "248.9k", trend: "+4.2%" },
              { icon: Eye, label: "Impressões", value: "2.1M", trend: "+12%" },
              { icon: Heart, label: "Engajamento", value: "8.4%", trend: "+1.1%" },
              { icon: TrendingUp, label: "Conversões", value: "12.3k", trend: "+18%" },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-2xl bg-white border border-border p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="h-9 w-9 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center">
                    <k.icon size={18} />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">{k.trend}</span>
                </div>
                <p className="mt-3 text-xl font-extrabold tracking-tight">{k.value}</p>
                <p className="text-[11px] text-foreground/60">{k.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chart placeholder */}
        <section className="px-4 mt-5">
          <div className="rounded-3xl bg-white border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Crescimento semanal</p>
                <p className="text-xs text-foreground/60">Últimos 7 dias</p>
              </div>
              <BarChart3 size={20} className="text-[#d81e62]" />
            </div>
            <div className="mt-4 h-40 flex items-end gap-2">
              {[35, 55, 40, 70, 60, 85, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-xl bg-brand-gradient"
                  style={{ height: `${h}%`, opacity: 0.4 + i * 0.08 }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-foreground/50">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="px-4 mt-5">
          <h2 className="text-sm font-bold text-foreground/60 uppercase tracking-wider">
            Ações rápidas
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { icon: Plus, label: "Criar post", to: "/create" },
              { icon: Radio, label: "Iniciar live", to: "/create" },
              { icon: MessageSquare, label: "Gerenciar grupos", to: "/groups" },
              { icon: Users, label: "Membros", to: "/communities" },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="rounded-2xl bg-white border border-border p-4 flex items-center gap-3 shadow-soft"
              >
                <span className="h-10 w-10 rounded-xl bg-brand-gradient text-white grid place-items-center">
                  <a.icon size={18} />
                </span>
                <span className="font-semibold text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom links */}
        <div className="px-4 mt-6">
          <Link to="/feed">
            <WButton variant="outline" size="lg" fullWidth>
              Ver feed público
            </WButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
