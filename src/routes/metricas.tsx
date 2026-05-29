import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  Heart,
  MessageSquare,
  Image,
  Trophy,
  Award,
  Crown,
  Zap,
  Star,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { metricsOverview, topActive } from "@/lib/mock-data";

export const Route = createFileRoute("/metricas")({
  head: () => ({ meta: [{ title: "Métricas — WEAZE" }] }),
  component: Metricas,
});

const iconMap: Record<string, typeof Heart> = {
  "❤️": Heart,
  "💬": MessageSquare,
  "📷": Image,
  "📊": TrendingUp,
};

const badgeIcons: Record<string, typeof Trophy> = {
  "🔥 Fogo": Flame,
  "💜 Top": Heart,
  "⭐ Destaque": Star,
  "💬 Conversador": MessageSquare,
  "👑 Rainha": Crown,
  "🏆 Campeão": Trophy,
};

function Metricas() {
  return (
    <AppShell title="Métricas">
      <div className="px-4 pt-3 space-y-5 pb-6">
        <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">Engajamento</p>
          <h2 className="mt-1 text-2xl font-extrabold">Suas métricas</h2>
          <p className="text-sm opacity-90">Acompanhe seu impacto na comunidade.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metricsOverview.map((m) => {
            const Icon = iconMap[m.icon] || Heart;
            return (
              <div key={m.id} className="rounded-2xl bg-white border border-border p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="h-10 w-10 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center text-lg">
                    {m.icon}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">{m.trend}</span>
                </div>
                <p className="mt-3 text-2xl font-extrabold tracking-tight">
                  {m.label === "Engajamento médio"
                    ? m.value + "%"
                    : m.value >= 1000
                      ? (m.value / 1000).toFixed(1) + "k"
                      : m.value}
                </p>
                <p className="text-[11px] text-foreground/60">{m.label}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white border border-border p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <div>
                <p className="font-bold text-sm">Ranking de engajamento</p>
                <p className="text-[11px] text-foreground/60">Top 10 mais ativos do mês</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {topActive.map((u, i) => {
              const BadgeIcon = badgeIcons[u.badge] || Award;
              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${
                    i < 3 ? "bg-brand-gradient-soft" : "bg-muted/50"
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 text-center font-extrabold text-sm ${
                      i === 0
                        ? "text-amber-500"
                        : i === 1
                          ? "text-gray-400"
                          : i === 2
                            ? "text-amber-700"
                            : "text-foreground/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="shrink-0 h-9 w-9 rounded-full bg-brand-gradient text-white grid place-items-center text-sm font-bold">
                    {u.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{u.name}</p>
                    <p className="text-[10px] text-foreground/50">{u.score} pontos</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#630091]">
                    <BadgeIcon size={12} />
                    {u.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-border p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-[#d81e62]" />
            <div>
              <p className="font-bold text-sm">Medalhas e conquistas</p>
              <p className="text-[11px] text-foreground/60">Badges disponíveis na plataforma</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { icon: Flame, label: "Fogo", desc: "Mais ativo do mês", color: "text-orange-500" },
              {
                icon: Star,
                label: "Destaque",
                desc: "Post mais curtido",
                color: "text-yellow-500",
              },
              {
                icon: Crown,
                label: "Rainha/Rey",
                desc: "Top engajamento",
                color: "text-purple-500",
              },
              { icon: Trophy, label: "Campeão", desc: "Primeiro lugar", color: "text-amber-500" },
              { icon: Heart, label: "Coração", desc: "Mais comentários", color: "text-[#d81e62]" },
              {
                icon: MessageSquare,
                label: "Conversador",
                desc: "Mais respostas",
                color: "text-[#630091]",
              },
              { icon: Zap, label: "Raio", desc: "Crescimento rápido", color: "text-blue-500" },
              { icon: Award, label: "Veterano", desc: "Desde o início", color: "text-emerald-500" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-muted/50"
              >
                <span
                  className={`h-10 w-10 rounded-xl bg-brand-gradient-soft grid place-items-center ${b.color}`}
                >
                  <b.icon size={20} />
                </span>
                <p className="mt-2 text-[11px] font-bold">{b.label}</p>
                <p className="text-[9px] text-foreground/50 leading-tight">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
