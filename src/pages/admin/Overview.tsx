import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useDeviceType } from "@/hooks/use-device-type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, Users, Heart, MessageCircle, Target } from "lucide-react";
import RankingSection from "@/components/RankingSection";
import BrandInsights from "@/components/BrandInsights";
import { cn } from "@/lib/utils";

const CTA_LABELS: Record<string, string> = {
  BUY: "Comprar",
  SCHEDULE: "Agendar",
  QUOTE: "Orçamento",
  REGISTER: "Inscrição",
};

function KPI({ label, value, hint, delta, icon: Icon }: { label: string; value: string; hint?: string; delta?: number; icon?: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          <p className="font-display text-3xl">{value}</p>
        </div>
        {(hint || delta !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {delta !== undefined && (
              <span className={cn("inline-flex items-center text-xs font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type CtaStats = { type: string; clicks: number; conversions: number };

export default function Overview() {
  const { tenant } = useTenant();
  const device = useDeviceType();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState({
    members: 0,
    newMembers: 0,
    memberGrowth: 0,
    likes: 0,
    comments: 0,
    engagementRate: 0,
    posts: 0,
    topPosts: [] as { id: string; description: string; engagement: number }[],
    avgEngagement: 0,
    ctaStats: [] as CtaStats[],
    conversions: 0,
    conversionRate: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    activeUsers: 0,
    interactions30: [] as { date: string; count: number }[],
    growth30: 0,
    alerts: [] as string[],
    insights: null as { best_post: string; best_hour: number; active_users: number; best_cta: string } | null,
  });

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const now = new Date();
      const dCurrent = new Date(now.getTime() - periodDays * 86400_000).toISOString();
      const dPrev = new Date(now.getTime() - periodDays * 2 * 86400_000).toISOString();
      const d1 = new Date(now.getTime() - 86400_000).toISOString();

      const [{ count: members }, { count: newMembers }, { data: interactions }, { data: posts }] = await Promise.all([
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("joined_at", dCurrent),
        supabase.from("interactions").select("user_id, created_at, action_type").eq("tenant_id", tenant.id).gte("created_at", dCurrent),
        supabase.from("posts").select("*").eq("tenant_id", tenant.id).gte("created_at", dCurrent).order("created_at", { ascending: false }),
      ]);

      const totalLikes = (interactions ?? []).filter((i) => i.action_type === "like").length;
      const totalComments = (interactions ?? []).filter((i) => i.action_type === "comment").length;
      const totalViews = (interactions ?? []).filter((i) => i.action_type === "view").length;
      const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

      const uniques = (rows: any[], since: string) => new Set(rows.filter((r) => r.user_id && r.created_at >= since).map((r) => r.user_id)).size;
      const dau = uniques(interactions ?? [], d1);
      const wau = uniques(interactions ?? [], new Date(now.getTime() - 7 * 86400_000).toISOString());
      const mau = uniques(interactions ?? [], dCurrent);

      const topPosts = ((posts ?? []) as any[])
        .map((p) => ({
          id: p.id,
          description: p.description?.slice(0, 50) ?? "Post",
          engagement: (p.likes_count ?? 0) + (p.comments_count ?? 0),
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      const avgEngagement = topPosts.length > 0 ? topPosts.reduce((a, b) => a + b.engagement, 0) / topPosts.length : 0;

      const ctaStats: CtaStats[] = [];
      const ctaTypes = ["BUY", "SCHEDULE", "QUOTE", "REGISTER"];
      for (const type of ctaTypes) {
        const clicks = (posts ?? []).reduce((a: number, p: any) => a + (p.cta_clicks ?? 0), 0);
        const conversions = (posts ?? []).reduce((a: number, p: any) => a + (p.conversions ?? 0), 0);
        ctaStats.push({ type, clicks, conversions });
      }

      const totalConversions = (posts ?? []).reduce((a: number, p: any) => a + (p.conversions ?? 0), 0);
      const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

      const buckets: Record<string, number> = {};
      for (let i = 0; i < periodDays; i++) {
        const k = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
        buckets[k] = 0;
      }
      (interactions ?? []).forEach((r: any) => {
        const k = r.created_at?.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      const interactions30 = Object.entries(buckets).reverse().map(([date, count]) => ({ date: date.slice(5), count }));

      const currentCount = (interactions ?? []).length;
      const prevCount = (interactions ?? []).length * 0.5;
      const growth30 = prevCount === 0 ? (currentCount > 0 ? 100 : 0) : ((currentCount - prevCount) / prevCount) * 100;

      const memberGrowth = (newMembers ?? 0) > 0 && members ? ((newMembers! / members) * 100) : 0;

      const alerts: string[] = [];
      if (growth30 < -20) alerts.push(`Engajamento caiu ${Math.abs(growth30).toFixed(0)}% no período`);

      setData({
        members: members ?? 0,
        newMembers: newMembers ?? 0,
        memberGrowth,
        likes: totalLikes,
        comments: totalComments,
        engagementRate,
        posts: posts?.length ?? 0,
        topPosts,
        avgEngagement,
        ctaStats,
        conversions: totalConversions,
        conversionRate,
        dau,
        wau,
        mau,
        activeUsers: mau,
        interactions30,
        growth30,
        alerts,
        insights: null,
      });
    })();
  }, [tenant?.id, period]);

  if (device === "mobile") {
    return (
      <div className="max-w-md mx-auto space-y-4 px-2 py-4">
        <div className="flex items-center gap-2">
          <Link to="/feed" className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl">Métricas</h1>
            <p className="text-muted-foreground text-sm mt-1">Desempenho da sua comunidade.</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 justify-end">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-background shadow" : "text-muted-foreground")}>
              {p}
            </button>
          ))}
        </div>

        {data.alerts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-2">
              {data.alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {a}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <KPI label="Membros" value={data.members.toString()} hint="total" icon={Users} />
          <KPI label="Novos" value={data.newMembers.toString()} delta={data.memberGrowth} icon={Users} />
          <KPI label="Curtidas" value={data.likes.toString()} icon={Heart} />
          <KPI label="Comentarios" value={data.comments.toString()} icon={MessageCircle} />
          <KPI label="Posts" value={data.posts.toString()} icon={Target} />
          <KPI label="Engajamento" value={`${data.engagementRate.toFixed(1)}%`} icon={TrendingUp} />
          <KPI label="DAU" value={data.dau.toString()} hint="24h" />
          <KPI label="MAU" value={data.mau.toString()} hint={period} delta={data.growth30} />
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display">Engajamento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.interactions30}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">CTA Funil</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.ctaStats.length > 0 ? (
              data.ctaStats.map((cta) => (
                <div key={cta.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{CTA_LABELS[cta.type] || cta.type}</span>
                  <div className="flex gap-4 text-xs">
                    <span>{cta.clicks} cliques</span>
                    <span className="text-muted-foreground">{cta.conversions} conversoes</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum CTA encontrado</p>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Taxa de conversão</span>
                <span className="text-sm">{data.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.topPosts.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-display">Posts Mais Engajados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.topPosts.map((post, i) => (
                <div key={post.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
                  <span className="text-sm flex-1 truncate">{post.description}</span>
                  <span className="text-xs text-muted-foreground">{post.engagement}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Gamificação: Ranking */}
        <Card>
          <CardHeader><CardTitle className="font-display">🏆 Ranking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <RankingSection period="monthly" />
          </CardContent>
        </Card>

        {/* Insights da Marca */}
        <BrandInsights />
      </div>
    );
  }

  return (
    <div className={device === "tablet" ? "max-w-3xl mx-auto space-y-6 px-4 py-6" : "max-w-6xl space-y-6"}>
      <div className="flex items-center gap-2">
        <Link to="/feed" className={(device as string) === "mobile" ? "p-2 -ml-2" : "hidden md:flex"}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className={(device as string) === "mobile" ? "font-display text-2xl" : "font-display text-4xl"}>Métricas</h1>
          <p className="text-muted-foreground text-sm mt-1">Desempenho da sua comunidade.</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-background shadow" : "text-muted-foreground")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {data.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 space-y-2">
            {data.alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" /> {a}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Membros" value={data.members.toString()} hint="total" icon={Users} />
        <KPI label="Novos" value={data.newMembers.toString()} delta={data.memberGrowth} icon={Users} />
        <KPI label="Curtidas" value={data.likes.toString()} icon={Heart} />
        <KPI label="Comentarios" value={data.comments.toString()} icon={MessageCircle} />
        <KPI label="Posts" value={data.posts.toString()} icon={Target} />
        <KPI label="Engajamento" value={`${data.engagementRate.toFixed(1)}%`} icon={TrendingUp} />
        <KPI label="DAU" value={data.dau.toString()} hint="24h" />
        <KPI label="MAU" value={data.mau.toString()} hint={period} delta={data.growth30} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="font-display">Engajamento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.interactions30}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">CTA Funil</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.ctaStats.length > 0 ? (
              data.ctaStats.map((cta) => (
                <div key={cta.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{CTA_LABELS[cta.type] || cta.type}</span>
                  <div className="flex gap-4 text-xs">
                    <span>{cta.clicks} cliques</span>
                    <span className="text-muted-foreground">{cta.conversions} conversoes</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum CTA encontrado</p>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Taxa de conversão</span>
                <span className="text-sm">{data.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.topPosts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display">Posts Mais Engajados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
                <span className="text-sm flex-1 truncate">{post.description}</span>
                <span className="text-xs text-muted-foreground">{post.engagement}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gamificação: Ranking e Premiação */}
      <Card>
        <CardHeader><CardTitle className="font-display">🏆 Ranking</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <RankingSection period="monthly" />
          <RankingSection period="yearly" />
        </CardContent>
      </Card>

      {/* Insights da Marca */}
      <BrandInsights />

      {/* Insights Automáticos */}
      {data.insights && (
        <Card className="bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <span className="text-brand">💡</span> Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.best_post && (
              <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-sm font-medium">Melhor post</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {data.insights.best_post}
                  </p>
                </div>
              </div>
            )}
            {data.insights.best_hour && (
              <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="text-sm font-medium">Melhor horário</p>
                  <p className="text-xs text-muted-foreground">
                    {data.insights.best_hour}:00
                  </p>
                </div>
              </div>
            )}
            {data.insights.active_users !== undefined && (
              <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="text-sm font-medium">Usuários ativos</p>
                  <p className="text-xs text-muted-foreground">
                    {data.insights.active_users}
                  </p>
                </div>
              </div>
            )}
            {data.insights.best_cta && (
              <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm font-medium">CTA mais clicado</p>
                  <p className="text-xs text-muted-foreground">
                    {CTA_LABELS[data.insights.best_cta] || data.insights.best_cta}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}