import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Users() {
  const { tenant } = useTenant();
  const [data, setData] = useState({ dau: 0, wau: 0, mau: 0, retention: 0, series: [] as any[] });

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
      const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const d1 = new Date(now.getTime() - 86400_000).toISOString();
      const d60 = new Date(now.getTime() - 60 * 86400_000).toISOString();

      const { data: ints } = await supabase.from("interactions")
        .select("user_id, created_at").eq("tenant_id", tenant.id).gte("created_at", d60);

      const ofPeriod = (since: string) => new Set((ints ?? []).filter(r => r.user_id && r.created_at >= since).map(r => r.user_id));
      const dauSet = ofPeriod(d1);
      const wauSet = ofPeriod(d7);
      const mauSet = ofPeriod(d30);
      const prevMonth = new Set((ints ?? []).filter(r => r.user_id && r.created_at < d30 && r.created_at >= d60).map(r => r.user_id));

      // Retenção: % de usuários do mês anterior que voltaram nos últimos 30d
      let returned = 0;
      prevMonth.forEach(u => { if (mauSet.has(u as any)) returned++; });
      const retention = prevMonth.size === 0 ? 0 : (returned / prevMonth.size) * 100;

      // Série DAU diário 30d
      const buckets: Record<string, Set<string>> = {};
      for (let i = 0; i < 30; i++) buckets[new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10)] = new Set();
      (ints ?? []).forEach((r: any) => {
        const k = r.created_at.slice(0, 10);
        if (k in buckets && r.user_id) buckets[k].add(r.user_id);
      });
      const series = Object.entries(buckets).reverse().map(([date, set]) => ({ date: date.slice(5), dau: set.size }));

      setData({ dau: dauSet.size, wau: wauSet.size, mau: mauSet.size, retention, series });
    })();
  }, [tenant?.id]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-4xl">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">Atividade e retenção.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["DAU", data.dau], ["WAU", data.wau], ["MAU", data.mau], ["Retenção 30d", `${data.retention.toFixed(1)}%`],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p><p className="font-display text-3xl mt-1">{v}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">DAU diário (30d)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="dau" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
