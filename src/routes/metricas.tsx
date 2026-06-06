import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  Image,
  Trophy,
  Award,
  Crown,
  Zap,
  Star,
  Flame,
} from "lucide-react";
import { Avatar } from "@/components/weaze/Avatar";
import { AppShell } from "@/components/weaze/AppShell";
import { metricsOverview, mockUserActivity } from "@/lib/mock-data";
import { computeRanking } from "@/lib/engagement-engine";
import { useWeaze } from "@/lib/weaze-context";
import { useCommunity } from "@/lib/community-store";

const ranking = computeRanking(mockUserActivity);

export const Route = createFileRoute("/metricas")({
  head: () => ({ meta: [{ title: "Métricas — WEAZE" }] }),
  component: Metricas,
});

const iconMap: Record<string, typeof Heart> = {
  "❤️": Heart,
  "💬": MessageSquare,
  "📤": Share2,
  "📷": Image,
  "📊": TrendingUp,
};

const badgeIcons: Record<string, typeof Trophy> = {
  "🔥 Fogo": Flame,
  "💜 Top": Heart,
  "⭐ Destaque": Star,
  "💬 Conversador": MessageSquare,
  "👑 Rainha": Crown,
  "🏅 Veterano": Award,
  "🏆 Campeão": Trophy,
  "⚡ Raio": Zap,
  "💚 Coração": Heart,
};

const baseMetrics = metricsOverview;

function Metricas() {
  const { metrics } = useWeaze();
  const { profileAvatar } = useCommunity();
  const allMetrics = [
    { ...baseMetrics[0], value: metrics.likes },
    { ...baseMetrics[1], value: metrics.comments },
    { id: "m3b", label: "Compartilhamentos", value: metrics.shares, trend: "+0%", icon: "📤" },
    ...baseMetrics.slice(2),
  ];
  const metricsCards = (
    <div className="grid grid-cols-2 gap-3">
      {allMetrics.map((m) => {
        const Icon = iconMap[m.icon] || Heart;
        return (
          <div key={m.id} className="rounded-2xl bg-white border border-border p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="h-10 w-10 rounded-xl bg-brand-gradient-soft text-[#000000] grid place-items-center text-lg">
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
  );

  const rankingSection = (
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
        {ranking.map((u, i) => {
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
              <Avatar
                name={u.name}
                size={36}
                src={u.name === "Você" ? profileAvatar : undefined}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{u.name}</p>
                <p className="text-[10px] text-foreground/50">{u.score} pontos</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#000000]">
                <BadgeIcon size={12} />
                {u.badge}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const badgesSection = (
    <div className="rounded-3xl bg-white border border-border p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Award size={20} className="text-[#000000]" />
        <div>
          <p className="font-bold text-sm">Medalhas e conquistas</p>
          <p className="text-[11px] text-foreground/60">Badges disponíveis na plataforma</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Fogo", desc: "Mais ativo do mês", color: "text-orange-500" },
          { icon: Heart, label: "Top", desc: "Alta performance", color: "text-purple-500" },
          { icon: Star, label: "Destaque", desc: "Post mais curtido", color: "text-yellow-500" },
          { icon: Crown, label: "Rainha/Rey", desc: "Top engajamento", color: "text-purple-500" },
          { icon: Trophy, label: "Campeão", desc: "Primeiro lugar", color: "text-amber-500" },
          { icon: Heart, label: "Coração", desc: "Mais comentários", color: "text-[#000000]" },
          { icon: MessageSquare, label: "Conversador", desc: "Mais respostas", color: "text-[#000000]" },
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
  );

  return (
    <>
      <div className="md:hidden">
        <AppShell title="Métricas">
          <div className="px-4 pt-3 space-y-5 pb-6">
            <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Engajamento</p>
              <h2 className="mt-1 text-2xl font-extrabold">Suas métricas</h2>
              <p className="text-sm opacity-90">Acompanhe seu impacto na comunidade.</p>
            </div>
            {metricsCards}
            {rankingSection}
            {badgesSection}
          </div>
        </AppShell>
      </div>

      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 min-h-dvh">
          <div className="flex-1 space-y-5 overflow-y-auto scrollbar-brand pb-6">
            <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Engajamento</p>
              <h2 className="mt-1 text-2xl font-extrabold">Suas métricas</h2>
              <p className="text-sm opacity-90">Acompanhe seu impacto na comunidade.</p>
            </div>
            <div className="max-w-3xl">
              {metricsCards}
            </div>
          </div>
          <div className="w-80 xl:w-96 shrink-0 space-y-5 overflow-y-auto scrollbar-brand pb-6">
            {rankingSection}
            {badgesSection}
          </div>
        </div>
      </div>
    </>
  );
}
