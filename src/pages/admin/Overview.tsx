import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function KPI({ label, value, hint, delta }: { label: string; value: string; hint?: string; delta?: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-3xl mt-1">{value}</p>
        {(hint || delta !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {delta !== undefined && (
              <span className={cn("inline-flex items-center text-xs font-medium",
                delta >= 0 ? "text-success" : "text-destructive")}>
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

export default function Overview() {
  const { tenant } = useTenant();
  const [data, setData] = useState({
    posts: 0, members: 0, mrr: 0, arr: 0,
    dau: 0, wau: 0, mau: 0,
    interactions30: [] as { date: string; count: number }[],
    growth30: 0,
    alerts: [] as string[],
  });

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
      const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const d1 = new Date(now.getTime() - 86400_000).toISOString();
      const d60 = new Date(now.getTime() - 60 * 86400_000).toISOString();

      const [{ count: posts }, { count: members }, { data: plan }, { data: ints }, { data: ints60 }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("tenant_plans").select("plans(price)").eq("tenant_id", tenant.id).maybeSingle(),
        supabase.from("interactions").select("user_id, created_at, action_type").eq("tenant_id", tenant.id).gte("created_at", d30),
        supabase.from("interactions").select("user_id, created_at").eq("tenant_id", tenant.id).gte("created_at", d60).lt("created_at", d30),
      ]);

      const mrr = Number((plan as any)?.plans?.price ?? 0);
      const arr = mrr * 12;

      const uniques = (rows: any[], since: string) => new Set(rows.filter(r => r.user_id && r.created_at >= since).map(r => r.user_id)).size;
      const dau = uniques(ints ?? [], d1);
      const wau = uniques(ints ?? [], d7);
      const mau = uniques(ints ?? [], d30);

      // Série 30d
      const buckets: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const k = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
        buckets[k] = 0;
      }
      (ints ?? []).forEach((r: any) => {
        const k = r.created_at.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      const interactions30 = Object.entries(buckets).reverse().map(([date, count]) => ({
        date: date.slice(5),
        count,
      }));

      const total30 = (ints ?? []).length;
      const total60 = (ints60 ?? []).length;
      const growth30 = total60 === 0 ? (total30 > 0 ? 100 : 0) : ((total30 - total60) / total60) * 100;

      const alerts: string[] = [];
      if (growth30 < -20) alerts.push(`Engajamento caiu ${Math.abs(growth30).toFixed(0)}% em 30 dias`);
      if (mau === 0 && (posts ?? 0) > 0) alerts.push("Sem usuários ativos no último mês");
      if ((posts ?? 0) === 0) alerts.push("Nenhum post publicado ainda");

      setData({ posts: posts ?? 0, members: members ?? 0, mrr, arr, dau, wau, mau, interactions30, growth30, alerts });
    })();
  }, [tenant?.id]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-4xl">Visão geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas-chave da sua marca nos últimos 30 dias.</p>
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
        <KPI label="MRR" value={`R$ ${data.mrr.toLocaleString("pt-BR")}`} hint="Plano atual" />
        <KPI label="ARR" value={`R$ ${data.arr.toLocaleString("pt-BR")}`} />
        <KPI label="Posts" value={data.posts.toString()} />
        <KPI label="Membros" value={data.members.toString()} />
        <KPI label="DAU" value={data.dau.toString()} hint="últimas 24h" />
        <KPI label="WAU" value={data.wau.toString()} hint="últimos 7 dias" />
        <KPI label="MAU" value={data.mau.toString()} hint="últimos 30 dias" delta={data.growth30} />
        <KPI label="Engajamento 30d" value={data.interactions30.reduce((a, b) => a + b.count, 0).toString()} />
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Engajamento — últimos 30 dias</CardTitle></CardHeader>
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
    </div>
  );
}
