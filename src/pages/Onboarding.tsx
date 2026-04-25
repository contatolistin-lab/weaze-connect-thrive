import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, Upload } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { selectTenant, refresh } = useTenant();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter menos de 5MB"); return; }
    setLogoFile(f);
    setLogo(URL.createObjectURL(f));
  };

  const uploadLogo = async (tenantId: string): Promise<string | null> => {
    if (!logoFile) return null;
    try {
      const ext = logoFile.name.split(".").pop();
      const path = `logos/${tenantId}.${ext}`;
      const { data, error } = await supabase.storage.from("public").upload(path, logoFile, { upsert: true });
      if (error) { toast.error(`Erro ao upload: ${error.message}`); return null; }
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (e: unknown) { toast.error(String(e)); return null; }
  };

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Nome muito curto"); return; }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("tenants").insert({
      name: name.trim(),
      slug: slugify(name),
      primary_color: "#d81e62",
      city: city.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); setLoading(false); return; }

    if (logoFile) {
      const logoUrl = await uploadLogo(data.id);
      if (logoUrl) {
        await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", data.id);
      }
    }

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
            <Label>Logotipo (opcional)</Label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary transition-colors overflow-hidden">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Upload</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <div className="text-sm text-muted-foreground">
                <p>PNG, JPG ou GIF</p>
                <p>Máx. 5MB</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Nome da marca</Label>
            <Input id="t-name" placeholder="Ex: Estúdio Weaze" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-city">Cidade</Label>
            <Input id="t-city" placeholder="Ex: São Paulo, SP" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-phone">Telefone</Label>
            <Input id="t-phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-bio">Biografia</Label>
            <Textarea id="t-bio" placeholder="Conte um pouco sobre sua marca..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
            {loading ? "Criando…" : "Criar marca"}
          </Button>
        </form>
      </div>
    </main>
  );
}