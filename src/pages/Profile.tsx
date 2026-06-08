import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Upload, MapPin, Headset, MessageSquare, Lightbulb, Bug } from "lucide-react";
import { toast } from "sonner";
import SupportRequestModal from "@/components/weaze/SupportRequestModal";
import { SupportType } from "@/hooks/useSupportMessages";

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-t-brand border-brand/20 rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
);

export default function Profile() {
  const { user, signOut, isB2B, appRole, initializing, loading: authLoading } = useAuth();
  const { tenant, isOwner, canManage, refresh, loading: tenantLoading, realLoadDone } = useTenant();

  const nav = useNavigate();

  // Determina se é admin/B2B assim que qualquer flag estiver disponível
  const isAdminUser = isB2B || appRole === "admin" || isOwner || canManage;
  const isB2BByMetadata = user?.user_metadata?.account_type === "b2b";

  // Redirect imediato via Navigate se já for B2B/admin (síncrono, sem flash)
  if (!initializing && !authLoading && realLoadDone && (isAdminUser || isB2BByMetadata)) {
    const communityPath = tenant?.slug ? `/m/${tenant.slug}` : "/feed";
    return <Navigate to={communityPath} replace />;
  }

  // Enquanto ainda está carregando auth ou tenant, mostra spinner
  if (initializing || authLoading || tenantLoading || !realLoadDone) {
    return <LoadingSpinner />;
  }

  // Se já resolveu e é B2B/admin, redireciona
  if (isAdminUser || isB2BByMetadata) {
    const communityPath = tenant?.slug ? `/m/${tenant.slug}` : "/feed";
    return <Navigate to={communityPath} replace />;
  }

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);
  const tenantFileRef = useRef<HTMLInputElement>(null);
  
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportType, setSupportType] = useState<SupportType>("duvida");
  

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    setAvatarFile(f);
    setAvatar(URL.createObjectURL(f));
  };

  const handleTenantLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    setTenantLogoFile(f);
    setTenantLogo(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    try {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("public").upload(path, avatarFile, { upsert: true });
      if (error) { toast.error(`Erro ao upload: ${error.message}`); return null; }
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      setAvatar(avatarUrl);
      return avatarUrl;
    } catch (e: any) { toast.error(e.message); return null; }
  };

  const uploadTenantLogo = async (): Promise<boolean> => {
    if (!tenantLogoFile || !tenant) return false;
    try {
      const ext = tenantLogoFile.name.split(".").pop();
      const path = `${tenant.id}/logo.${ext}`;
      const { error } = await supabase.storage.from("public").upload(path, tenantLogoFile, { upsert: true });
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

  const save = async () => {
    if (!user) return;
    setLoading(true);

    let uploadedAvatarUrl: string | null = null;
    if (avatarFile) {
      uploadedAvatarUrl = await uploadAvatar();
      if (!uploadedAvatarUrl) { setLoading(false); return; }
      setAvatarFile(null);
    }

    const { error } = await supabase.from("profiles").update({
      name: name.trim(), 
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
    }).eq("user_id", user.id);
    if (error) { setLoading(false); toast.error(error.message); return; }

    if (tenant && (isOwner || canManage)) {
      const tenantUpdate: Record<string, string> = { name: name.trim() };
      if (uploadedAvatarUrl) tenantUpdate.logo_url = uploadedAvatarUrl;
      await supabase.from("tenants").update(tenantUpdate).eq("id", tenant.id);
      await refresh();
    }

    setLoading(false);
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

{tenant?.id && (
          <section className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-soft">
            <div className="flex items-center gap-2">
              <Headset className="h-5 w-5" />
              <h2 className="font-semibold">Central de Atendimento</h2>
            </div>
            <p className="text-sm text-muted-foreground">Entre em contato com a equipe da comunidade.</p>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => { setSupportType("duvida"); setSupportOpen(true); }}
              >
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">Enviar Dúvida</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => { setSupportType("sugestao"); setSupportOpen(true); }}
              >
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">Enviar Sugestão</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => { setSupportType("problema"); setSupportOpen(true); }}
              >
                <Bug className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">Reportar Problema</p>
                </div>
              </Button>
            </div>
          </section>
        )}

        {tenant?.id && user && (
          <SupportRequestModal
            open={supportOpen}
            onOpenChange={setSupportOpen}
            communityId={tenant.id}
            userId={user.id}
            userName={name || user.email || "Usuário"}
            userEmail={user.email || ""}
            defaultType={supportType}
          />
        )}

        <Button variant="ghost" onClick={async () => { await signOut(); nav("/auth"); }} className="w-full text-destructive">
          <LogOut className="h-4 w-4 mr-2" />Sair
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}