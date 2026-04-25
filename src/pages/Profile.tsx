import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, BarChart3, Building2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { tenant, isOwner, tenants } = useTenant();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("name, phone").eq("user_id", user.id).maybeSingle();
      if (data) { setName(data.name ?? ""); setPhone(data.phone ?? ""); }
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(), phone: phone.trim() || null,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-brand grid place-items-center text-primary-foreground text-2xl font-bold">
            {(name || user?.email || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl truncate">{name || "Seu perfil"}</h1>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-soft">
          <h2 className="font-semibold">Dados</h2>
          <div><Label htmlFor="p-name">Nome</Label><Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="p-phone">Telefone</Label><Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
          <Button onClick={save} disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </section>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-2 shadow-soft">
          <h2 className="font-semibold mb-2">Comunidade</h2>
          <p className="text-sm text-muted-foreground mb-3">Você está em <strong>{tenant?.name ?? "—"}</strong></p>
          <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
            <Link to="/communities"><ArrowLeftRight className="h-4 w-4 mr-2" />Trocar de comunidade ({tenants.length})</Link>
          </Button>
          {isOwner && (
            <>
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link to="/admin"><BarChart3 className="h-4 w-4 mr-2" />Painel da marca</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link to="/admin/content"><Building2 className="h-4 w-4 mr-2" />Gerenciar conteúdo</Link>
              </Button>
            </>
          )}
        </section>

        <Button variant="ghost" onClick={async () => { await signOut(); nav("/"); }} className="w-full text-destructive">
          <LogOut className="h-4 w-4 mr-2" />Sair
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
