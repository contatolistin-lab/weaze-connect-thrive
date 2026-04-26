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
import { LogOut, BarChart3, Building2, ArrowLeftRight, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
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
      const { data } = await supabase.from("profiles").select("name, phone, avatar_url").eq("user_id", user.id).maybeSingle();
      if (data) { setName(data.name ?? ""); setPhone(data.phone ?? ""); setAvatar(data.avatar_url ?? null); }
    })();
  }, [user?.id]);

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
