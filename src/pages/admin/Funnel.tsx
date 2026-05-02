import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Row = { type: string; views: number; clicks: number; conversions: number; rate: number };

export default function Funnel() {
  const { tenant } = useTenant();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data } = await supabase.from("interactions")
        .select("action_type, cta_id, post_cta:cta_id(type)")
        .eq("tenant_id", tenant.id);

      const acc: Record<string, { views: number; clicks: number; conversions: number }> = {};
      const ensure = (k: string) => (acc[k] ??= { views: 0, clicks: 0, conversions: 0 });

      // views são por post (sem CTA), então somamos TODAS as views ao agregado "all"
      let allViews = 0;
      (data ?? []).forEach((r: any) => {
        if (r.action_type === "view") allViews++;
        const t = r.post_cta?.type;
        if (!t) return;
        const b = ensure(t);
        if (r.action_type === "click_cta") b.clicks++;
        if (r.action_type === "conversion") b.conversions++;
      });

      const result: Row[] = Object.entries(acc).map(([type, v]) => ({
        type, views: allViews, clicks: v.clicks, conversions: v.conversions,
        rate: v.clicks ? (v.conversions / v.clicks) * 100 : 0,
      }));
      setRows(result.sort((a, b) => b.clicks - a.clicks));
    })();
  }, [tenant?.id]);

  const exportCsv = () => {
    const csv = ["type,views,clicks,conversions,conversion_rate", ...rows.map(r => `${r.type},${r.views},${r.clicks},${r.conversions},${r.rate.toFixed(2)}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "funnel.csv"; a.click();
  };

  const labels: Record<string, string> = { buy: "Comprar", schedule: "Agendar", quote: "Orçamento", register: "Inscrição", info: "Info" };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Funil de CTAs</h1>
          <p className="text-muted-foreground text-sm mt-1">Views totais, clicks e conversões por tipo de CTA.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />CSV</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Conversão por CTA</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 || (rows.length === 1 && rows[0].clicks === 0 && rows[0].conversions === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem atividade de CTAs ainda. Adicione CTAs aos posts para medir conversões.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Views (feed)</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.type}>
                    <TableCell className="font-medium">{labels[r.type] ?? r.type}</TableCell>
                    <TableCell className="text-right">{r.views}</TableCell>
                    <TableCell className="text-right">{r.clicks}</TableCell>
                    <TableCell className="text-right">{r.conversions}</TableCell>
                    <TableCell className="text-right font-medium text-accent">{r.rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
