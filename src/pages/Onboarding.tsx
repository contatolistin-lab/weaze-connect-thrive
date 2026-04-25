import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { selectTenant, refresh } = useTenant();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#d81e62");
  const [loading, setLoading] = useState(false);

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Nome muito curto"); return; }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("tenants").insert({
      name: name.trim(), slug: slugify(name), primary_color: color, created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); setLoading(false); return; }

    // membership owner é criada por trigger handle_new_tenant
    const { data: free } = await supabase.from("plans").select("id").eq("name", "Free").maybeSingle();
    if (free) await supabase.from("tenant_plans").insert({ tenant_id: data.id, plan_id: free.id });

    await refresh();
    selectTenant(data.id);
    toast.success("Marca criada");
    nav("/feed");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <div className="relative max-w-md mx-auto">
        <Link to="/communities" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Voltar
        </Link>
        <h1 className="font-display text-4xl mb-2">Crie sua marca</h1>
        <p className="text-muted-foreground mb-8 text-pretty">
          Cada marca é um ambiente isolado: feed, comunidade, agenda e analytics próprios.
        </p>

        <form onSubmit={create} className="bg-card rounded-2xl p-6 shadow-elevated border border-border space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Nome da marca</Label>
            <Input id="t-name" placeholder="Ex: Estúdio Weaze" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-color">Cor de destaque</Label>
            <div className="flex gap-2 items-center">
              <input id="t-color" type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-11 w-14 rounded-lg border border-input cursor-pointer" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
            {loading ? "Criando…" : "Criar marca"}
          </Button>
        </form>
      </div>
    </main>
  );
}
