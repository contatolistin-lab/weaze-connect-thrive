import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Tenants() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState({ posts: 0, members: 0, ctas: 0, services: 0, events: 0, appointments: 0, quotes: 0, regs: 0 });

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const c = (q: any) => q.then((r: any) => r.count ?? 0);
      const id = tenant.id;
      const [posts, members, ctas, services, events, appointments, quotes, regs] = await Promise.all([
        c(supabase.from("posts").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("post_cta").select("post_id, posts!inner(tenant_id)", { count: "exact", head: true }).eq("posts.tenant_id", id)),
        c(supabase.from("services").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("events").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("quotes").select("*", { count: "exact", head: true }).eq("tenant_id", id)),
        c(supabase.from("event_registrations").select("event_id, events!inner(tenant_id)", { count: "exact", head: true }).eq("events.tenant_id", id)),
      ]);
      setStats({ posts, members, ctas, services, events, appointments, quotes, regs });
    })();
  }, [tenant?.id]);

  const rows: [string, number][] = [
    ["Posts", stats.posts], ["Membros", stats.members], ["CTAs ativos", stats.ctas],
    ["Serviços", stats.services], ["Eventos", stats.events],
    ["Agendamentos", stats.appointments], ["Orçamentos", stats.quotes], ["Inscrições", stats.regs],
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-4xl">{tenant?.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Snapshot completo da marca.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Métrica</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(([k, v]) => (
                <TableRow key={k}><TableCell className="font-medium">{k}</TableCell><TableCell className="text-right font-display text-xl">{v}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
