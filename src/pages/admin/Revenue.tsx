import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Download } from "lucide-react";

export default function Revenue() {
  const { tenant } = useTenant();
  const [plan, setPlan] = useState<{ name: string; price: number } | null>(null);
  const [series, setSeries] = useState<{ month: string; mrr: number }[]>([]);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data } = await supabase.from("tenant_plans").select("active_since, plans(name, price)").eq("tenant_id", tenant.id).maybeSingle();
      const p = (data as any)?.plans;
      if (p) setPlan({ name: p.name, price: Number(p.price) });
      const since = new Date((data as any)?.active_since ?? Date.now());
      const out: { month: string; mrr: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const active = d >= new Date(since.getFullYear(), since.getMonth(), 1);
        out.push({ month: d.toLocaleDateString("pt-BR", { month: "short" }), mrr: active ? Number(p?.price ?? 0) : 0 });
      }
      setSeries(out);
    })();
  }, [tenant?.id]);

  const exportCsv = () => {
    const csv = ["month,mrr", ...series.map(r => `${r.month},${r.mrr}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "revenue.csv"; a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Receita</h1>
          <p className="text-muted-foreground text-sm mt-1">MRR atual e histórico estimado dos últimos 12 meses.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Plano</p><p className="font-display text-3xl mt-1">{plan?.name ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">MRR</p><p className="font-display text-3xl mt-1">R$ {(plan?.price ?? 0).toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">ARR</p><p className="font-display text-3xl mt-1">R$ {((plan?.price ?? 0) * 12).toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Acumulado 12m</p><p className="font-display text-3xl mt-1">R$ {series.reduce((a, b) => a + b.mrr, 0).toLocaleString("pt-BR")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">MRR — últimos 12 meses</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="mrr" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
