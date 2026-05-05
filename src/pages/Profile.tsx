import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, BarChart3, Building2, ArrowLeftRight, Upload, Trophy, MapPin, TrendingUp, Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { getUserStats } from "@/lib/gamification";

export default function Profile() {
  const { user, signOut, isB2C } = useAuth();
  const { tenant, isOwner, tenants } = useTenant();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);
  const tenantFileRef = useRef<HTMLInputElement>(null);
  
  // Location fields
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  
  // Gamification
  const [userPoints, setUserPoints] = useState<{total: number; monthly: number; yearly: number} | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter menos de 5MB"); return; }
    setAvatarFile(f);
    setAvatar(URL.createObjectURL(f));
  };

  const handleTenantLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter menos de 5MB"); return; }
    setTenantLogoFile(f);
    setTenantLogo(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<boolean> => {
    if (!avatarFile || !user) return false;
    try {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { data, error } = await supabase.storage.from("public").upload(path, avatarFile, { upsert: true });
      if (error) { toast.error(`Erro ao upload: ${error.message}`); return false; }
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      setAvatar(avatarUrl);
      return true;
    } catch (e: any) { toast.error(e.message); return false; }
  };

  const uploadTenantLogo = async (): Promise<boolean> => {
    if (!tenantLogoFile || !tenant) return false;
    try {
      const ext = tenantLogoFile.name.split(".").pop();
      const path = `logos/${tenant.id}.${ext}`;
      const { data, error } = await supabase.storage.from("public").upload(path, tenantLogoFile, { upsert: true });
      if (error) { toast.error(`Erro ao upload: ${error.message}`); return false; }
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id);
      setTenantLogo(logoUrl);
      return true;
    } catch (e: any) { toast.error(e.message); return false; }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("name, phone, avatar_url, city, state, country").eq("user_id", user.id).maybeSingle();
      if (data) { 
        setName(data.name ?? ""); 
        setPhone(data.phone ?? ""); 
        setAvatar(data.avatar_url ?? null);
        setCity(data.city ?? "");
        setState(data.state ?? "");
        setCountry(data.country ?? "");
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user || !tenant) return;
    (async () => {
      const stats = await getUserStats(user.id, tenant.id);
      if (stats) setUserPoints({ total: stats.total_points, monthly: stats.monthly_points, yearly: stats.yearly_points });
    })();
  }, [user?.id, tenant?.id]);

  useEffect(() => {
    if (tenant) { setTenantLogo(tenant.logo_url); }
  }, [tenant?.logo_url]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    if (avatarFile) {
      const ok = await uploadAvatar();
      if (!ok) { setLoading(false); return; }
      setAvatarFile(null);
    }
    const { error } = await supabase.from("profiles").update({
      name: name.trim(), 
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
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
          <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
            <div className="h-16 w-16 rounded-2xl bg-brand grid place-items-center text-primary-foreground text-2xl font-bold overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (name || user?.email || "?")[0]?.toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl truncate">{name || "Seu perfil"}</h1>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <section className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-soft">
          <h2 className="font-semibold">Dados</h2>
          <div><Label htmlFor="p-name">Nome</Label><Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="p-phone">Telefone</Label><Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
          
          {userPoints && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Sua Pontuação</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-700">{userPoints.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{userPoints.monthly}</p>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{userPoints.yearly}</p>
                  <p className="text-xs text-muted-foreground">Este ano</p>
                </div>
              </div>
              <Button variant="outline" className="w-full text-sm mt-3" asChild>
                <Link to="/metrics"><TrendingUp className="h-4 w-4 mr-2" />Ver Ranking</Link>
              </Button>
            </div>
          )}
          
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Localização
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="p-city" className="text-xs">Cidade</Label><Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={50} placeholder="São Paulo" /></div>
              <div><Label htmlFor="p-state" className="text-xs">Estado</Label><Input id="p-state" value={state} onChange={(e) => setState(e.target.value)} maxLength={50} placeholder="SP" /></div>
            </div>
            <div><Label htmlFor="p-country" className="text-xs">País</Label><Input id="p-country" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={50} placeholder="Brasil" /></div>
          </div>
          
          <Button onClick={save} disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </section>

        {isOwner && tenant && (
          <section className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-soft">
            <h2 className="font-semibold">Logotipo da marca</h2>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => tenantFileRef.current?.click()} className="relative group">
                <div className="h-20 w-20 rounded-2xl bg-brand grid place-items-center text-primary-foreground text-2xl font-bold overflow-hidden">
                  {tenantLogo ? (
                    <img src={tenantLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </button>
              <input ref={tenantFileRef} type="file" accept="image/*" className="hidden" onChange={handleTenantLogoChange} />
              <div className="text-sm text-muted-foreground">
                <p>PNG, JPG ou GIF</p>
                <p>Máx. 5MB</p>
              </div>
            </div>
            {tenantLogoFile && (
              <Button onClick={async () => { setLoading(true); const ok = await uploadTenantLogo(); setLoading(false); if (ok) toast.success("Logo atualizado"); }} disabled={loading} className="w-full">
                {loading ? "Salvando…" : "Salvar logo"}
              </Button>
            )}
          </section>
        )}

        <section className="bg-card rounded-2xl border border-border p-5 space-y-2 shadow-soft">
          <h2 className="font-semibold mb-2">Comunidade</h2>
          <p className="text-sm text-muted-foreground mb-3">Você está em <strong>{tenant?.name ?? "—"}</strong></p>
          {isB2C && (
            <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
              <Link to="/communities"><ArrowLeftRight className="h-4 w-4 mr-2" />Trocar de comunidade ({tenants.length})</Link>
            </Button>
          )}
{isOwner && (
            <div className="bg-gradient-to-r from-[#630091]/10 to-[#d81e62]/10 rounded-xl p-4 border border-[#630091]/20">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-[#630091]" />
                <span className="font-semibold text-sm">Link da sua comunidade</span>
              </div>
              <code className="text-xs text-muted-foreground break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/m/{tenant?.slug || "sua-marca"}
              </code>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const link = `${window.location.origin}/m/${tenant?.slug || "sua-marca"}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link copiado!");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copiar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <a href={`/m/${tenant?.slug || "sua-marca"}`} target="_blank">
                    <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                  </a>
                </Button>
              </div>
            </div>
          )}
          {(isOwner) && (
            <>
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link to="/admin"><BarChart3 className="h-4 w-4 mr-2" />Painel da marca</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link to="/admin/content"><Building2 className="h-4 w-4 mr-2" />Gerenciar conteúdo</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link to="/metrics/invites"><Link2 className="h-4 w-4 mr-2" />Links de convite</Link>
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