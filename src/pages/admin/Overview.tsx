import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useDeviceType } from "@/hooks/use-device-type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, Users, Heart, MessageCircle, Target } from "lucide-react";
import RankingSection from "@/components/RankingSection";
import BrandInsights from "@/components/BrandInsights";
import { cn } from "@/lib/utils";

const CTA_LABELS: Record<string, string> = {
  buy: "Comprar",
  schedule: "Agendar",
  quote: "Orçamento",
  register: "Inscrição",
  info: "Saiba mais",
  live: "Live",
};

function KPI({ label, value, hint, delta, icon: Icon }: { label: string; value: string; hint?: string; delta?: number | null; icon?: React.ElementType }) {
  const showDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          <p className="font-display text-3xl">{value}</p>
        </div>
        {(hint || showDelta) && (
          <div className="flex items-center gap-2 mt-2">
            {showDelta && (
              <span className={cn("inline-flex items-center text-xs font-medium", (delta as number) >= 0 ? "text-success" : "text-destructive")}>
                {(delta as number) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {(delta as number) >= 0 ? "+" : ""}{(delta as number).toFixed(1)}%
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
type TopPost = { id: string; description: string; engagement: number };

export default function Overview() {
  const { tenant } = useTenant();
  const device = useDeviceType();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState({
    members: 0,
    newMembers: 0,
    memberGrowth: null as number | null,
    likes: 0,
    comments: 0,
    engagementRate: 0,
    posts: 0,
    topPosts: [] as TopPost[],
    ctaStats: [] as CtaStats[],
    conversions: 0,
    conversionRate: 0,
    dau: 0,
    mau: 0,
    interactions30: [] as { date: string; count: number }[],
    growth30: null as number | null,
    alerts: [] as string[],
    conversationsCount: 0,
  });

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const now = new Date();
      const dCurrent = new Date(now.getTime() - periodDays * 86400_000).toISOString();
      const dPrev = new Date(now.getTime() - periodDays * 2 * 86400_000).toISOString();
      const d1 = new Date(now.getTime() - 86400_000).toISOString();

      const [
        { count: members },
        { count: newMembers },
        { data: interactionsAll },
        { data: posts },
        { data: ctaRows },
        { data: topicsRows },
      ] = await Promise.all([
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", dCurrent),
        supabase.from("interactions").select("user_id, created_at, action_type, post_id, cta_id").eq("tenant_id", tenant.id).gte("created_at", dPrev),
        supabase.from("posts").select("id, description, created_at").eq("tenant_id", tenant.id).gte("created_at", dCurrent).order("created_at", { ascending: false }),
        supabase.from("post_cta").select("id, type, post_id"),
        supabase.from("topics").select("id, created_at").eq("tenant_id", tenant.id).gte("created_at", dCurrent),
      ]);

      const all = interactionsAll ?? [];
      const current = all.filter((i: any) => i.created_at >= dCurrent);
      const previous = all.filter((i: any) => i.created_at < dCurrent);

      const totalLikes = current.filter((i: any) => i.action_type === "like").length;
      const totalComments = current.filter((i: any) => i.action_type === "comment").length;
      const totalClicks = current.filter((i: any) => i.action_type === "click_cta").length;
      const totalConversions = current.filter((i: any) => i.action_type === "conversion").length;

      const engagementRate = members && members > 0 ? ((totalLikes + totalComments) / members) * 100 : 0;

      const uniques = (rows: any[], since: string) =>
        new Set(rows.filter((r: any) => r.user_id && r.created_at >= since && ["like", "comment", "click_cta", "conversion"].includes(r.action_type)).map((r: any) => r.user_id)).size;
      const dau = uniques(all, d1);
      const mau = uniques(all, dCurrent);

      // Top posts: sum likes+comments interactions per post_id
      const postEngage: Record<string, number> = {};
      current.forEach((i: any) => {
        if (!i.post_id) return;
        if (i.action_type === "like" || i.action_type === "comment") {
          postEngage[i.post_id] = (postEngage[i.post_id] ?? 0) + 1;
        }
      });
      const postMap = new Map((posts ?? []).map((p: any) => [p.id, p]));
      const topPosts: TopPost[] = Object.entries(postEngage)
        .map(([id, engagement]) => {
          const p: any = postMap.get(id);
          return { id, description: (p?.description ?? "Post").slice(0, 60), engagement };
        })
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      // CTA funnel by type
      const ctaTypeOf = new Map((ctaRows ?? []).map((c: any) => [c.id, c.type]));
      const ctaAgg: Record<string, { clicks: number; conversions: number }> = {};
      current.forEach((i: any) => {
        if (!i.cta_id) return;
        const t = ctaTypeOf.get(i.cta_id);
        if (!t) return;
        ctaAgg[t] = ctaAgg[t] ?? { clicks: 0, conversions: 0 };
        if (i.action_type === "click_cta") ctaAgg[t].clicks++;
        if (i.action_type === "conversion") ctaAgg[t].conversions++;
      });
      const ctaStats: CtaStats[] = Object.entries(ctaAgg).map(([type, v]) => ({ type, ...v }));
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Daily buckets
      const buckets: Record<string, number> = {};
      for (let i = 0; i < periodDays; i++) {
        const k = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
        buckets[k] = 0;
      }
      current.forEach((r: any) => {
        const k = r.created_at?.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      const interactions30 = Object.entries(buckets).reverse().map(([date, count]) => ({ date: date.slice(5), count }));

      const currentCount = current.length;
      const prevCount = previous.length;
      const growth30 = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : null;
      const memberGrowth = (newMembers ?? 0) > 0 && members && members > (newMembers ?? 0)
        ? ((newMembers as number) / ((members as number) - (newMembers as number))) * 100
        : null;

      const alerts: string[] = [];
      if (growth30 !== null && growth30 < -20) alerts.push(`Engajamento caiu ${Math.abs(growth30).toFixed(0)}% no período`);

      setData({
        members: members ?? 0,
        newMembers: newMembers ?? 0,
        memberGrowth,
        likes: totalLikes,
        comments: totalComments,
        engagementRate,
        posts: posts?.length ?? 0,
        topPosts,
        ctaStats,
        conversions: totalConversions,
        conversionRate,
        dau,
        mau,
        interactions30,
        growth30,
        alerts,
        conversationsCount: topicsRows?.length ?? 0,
      });
    })();
  }, [tenant?.id, period]);

  const hasChartData = data.interactions30.some((d) => d.count > 0);

  const Chart = (
    <Card>
      <CardHeader><CardTitle className="font-display">Engajamento</CardTitle></CardHeader>
      <CardContent>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={device === "mobile" ? 180 : 260}>
            <AreaChart data={data.interactions30}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-center text-muted-foreground text-sm px-4">
            Pouca atividade ainda. Incentive interações para ver o gráfico.
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CtaCard = (
    <Card>
      <CardHeader><CardTitle className="font-display">CTA Funil</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.ctaStats.length > 0 ? (
          <>
            {data.ctaStats.map((cta) => (
              <div key={cta.type} className="flex items-center justify-between">
                <span className="text-sm font-medium">{CTA_LABELS[cta.type] || cta.type}</span>
                <div className="flex gap-4 text-xs">
                  <span>{cta.clicks} cliques</span>
                  <span className="text-muted-foreground">{cta.conversions} conversões</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t flex justify-between">
              <span className="text-sm font-medium">Taxa de conversão</span>
              <span className="text-sm">{data.conversionRate.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sem atividade de CTAs ainda.</p>
        )}
      </CardContent>
    </Card>
  );

  const TopPostsCard = (
    <Card>
      <CardHeader><CardTitle className="font-display">Posts Mais Engajados</CardTitle></CardHeader>
      <CardContent className={data.topPosts.length > 0 ? "space-y-2" : "py-8 text-center text-muted-foreground text-sm"}>
        {data.topPosts.length > 0 ? data.topPosts.map((post, i) => (
          <div key={post.id} className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
            <span className="text-sm flex-1 truncate">{post.description}</span>
            <span className="text-xs text-muted-foreground">{post.engagement}</span>
          </div>
        )) : "Nenhum post com engajamento ainda. Incentive interações!"}
      </CardContent>
    </Card>
  );

  const KpiGrid = (
    <div className={device === "mobile" ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
      <KPI label="Membros" value={data.members.toString()} hint="total" icon={Users} />
      <KPI label="Novos" value={data.newMembers.toString()} delta={data.memberGrowth} hint={period} icon={Users} />
      <KPI label="Curtidas" value={data.likes.toString()} icon={Heart} />
      <KPI label="Comentários" value={data.comments.toString()} icon={MessageCircle} />
      <KPI label="Posts" value={data.posts.toString()} icon={Target} />
      <KPI label="Engajamento" value={`${data.engagementRate.toFixed(1)}%`} hint="por membro" icon={TrendingUp} />
      <KPI label="DAU" value={data.dau.toString()} hint="24h" />
      <KPI label="MAU" value={data.mau.toString()} hint={period} delta={data.growth30} />
    </div>
  );

  if (device === "mobile") {
    return (
      <div className="max-w-md mx-auto space-y-4 px-2 py-4">
        <div className="flex items-center gap-2">
          <Link to="/feed" className="p-2 -ml-2"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl">Métricas</h1>
            <p className="text-muted-foreground text-sm mt-1">Desempenho da sua comunidade.</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 justify-end">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-background shadow" : "text-muted-foreground")}>{p}</button>
          ))}
        </div>
        {data.alerts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4 space-y-2">
            {data.alerts.map((a, i) => (<div key={i} className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" /> {a}</div>))}
          </CardContent></Card>
        )}
        {KpiGrid}
        {Chart}
        {CtaCard}
        {TopPostsCard}
        <Card>
          <CardHeader><CardTitle className="font-display">🏆 Ranking</CardTitle></CardHeader>
          <CardContent><RankingSection period="monthly" /></CardContent>
        </Card>
        <BrandInsights conversationsCount={data.conversationsCount} ctaClicks={totalClicksFromState(data)} />
      </div>
    );
  }

  return (
    <div className={device === "tablet" ? "max-w-3xl mx-auto space-y-6 px-4 py-6" : "max-w-6xl space-y-6"}>
      <div className="flex items-center gap-2">
        <Link to="/feed" className="hidden md:flex"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-display text-4xl">Métricas</h1>
          <p className="text-muted-foreground text-sm mt-1">Desempenho da sua comunidade.</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-background shadow" : "text-muted-foreground")}>{p}</button>
          ))}
        </div>
      </div>
      {data.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4 space-y-2">
          {data.alerts.map((a, i) => (<div key={i} className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" /> {a}</div>))}
        </CardContent></Card>
      )}
      {KpiGrid}
      <div className="grid md:grid-cols-2 gap-4">{Chart}{CtaCard}</div>
      {TopPostsCard}
      <Card>
        <CardHeader><CardTitle className="font-display">🏆 Ranking</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <RankingSection period="monthly" />
          <RankingSection period="yearly" />
        </CardContent>
      </Card>
      <BrandInsights conversationsCount={data.conversationsCount} ctaClicks={totalClicksFromState(data)} />
    </div>
  );
}

function totalClicksFromState(d: { ctaStats: CtaStats[] }): number {
  return d.ctaStats.reduce((a, c) => a + c.clicks, 0);
}
