import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function Auth() {
  const nav = useNavigate();
  const { loading: authLoading, initializing, user, appRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fromInvite, setFromInvite] = useState(false);
  const [inviteTenantName, setInviteTenantName] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2c");
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });

  useEffect(() => {
    const pendingSlug = localStorage.getItem("weaze:pending_invite_slug") || sessionStorage.getItem("weaze:pending_invite_slug");
    if (pendingSlug) {
      setFromInvite(true);
      supabase.from("tenants").select("name").eq("slug", pendingSlug).single()
        .then(({ data }) => {
          if (data) setInviteTenantName(data.name);
        });
    }
  }, []);

  // Efeito de redirect imediato — sem Navigate, sem null render
  const shouldRedirect = user && !authLoading && !initializing && appRole !== null;
  const redirectTo = (() => {
    if (!shouldRedirect) return null;
    const slug = localStorage.getItem("weaze:pending_invite_slug") || sessionStorage.getItem("weaze:pending_invite_slug");
    if (slug) return `/c/${slug}`;
    const share = localStorage.getItem("weaze:pending_share");
    if (share) {
      try { const { tenantId, postId } = JSON.parse(share); return `/compartilhar/${tenantId}/${postId}`; } catch {}
    }
    return "/feed";
  })();

  useEffect(() => {
    if (redirectTo) nav(redirectTo, { replace: true });
  }, [redirectTo, nav]);

  // Loading idêntico ao de App.tsx — fixed inset-0, sem flash
  if (redirectTo || initializing || authLoading || (user && appRole === null)) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-t-brand border-brand/20 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signup);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { name: parsed.data.name, account_type: accountType },
      },
    });

    if (error) { setLoading(false); toast.error(error.message); return; }

    if (authData.user) {
      await supabase.from("profiles").upsert({
        user_id: authData.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
      });
    }

    setLoading(false);
    toast.success("Conta criada! Bem-vindo!");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginSchema = z.object({
      email: z.string().trim().email("Email inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    });
    const parsed = loginSchema.safeParse(login);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (error) { setLoading(false); toast.error(error.message); return; }

    setLoading(false);
    toast.success("Bem-vindo");
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <Link to="/" className="flex items-center justify-center mb-10">
          <Logo size={160} />
        </Link>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
          {fromInvite && inviteTenantName && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <p className="text-sm text-purple-700">Você está entrando na comunidade</p>
              <p className="font-semibold text-purple-900">{inviteTenantName}</p>
            </div>
          )}

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" autoComplete="email" value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="li-pw">Senha</Label>
                  <Input id="li-pw" type="password" autoComplete="current-password" value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                {fromInvite && (
                  <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">Cadastro para participar da comunidade</p>
                  </div>
                )}
                {!fromInvite && (
                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <AccountTypeOption
                        active={accountType === "b2c"}
                        onClick={() => setAccountType("b2c")}
                        icon={Users}
                        title="Usuário"
                        desc="Participar de comunidades"
                      />
                      <AccountTypeOption
                        active={accountType === "b2b"}
                        onClick={() => setAccountType("b2b")}
                        icon={Building2}
                        title="Marca"
                        desc="Criar minha comunidade"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">{!fromInvite && accountType === "b2b" ? "Nome da marca / responsável" : "Nome"}</Label>
                  <Input id="su-name" maxLength={80} value={signup.name} placeholder={!fromInvite && accountType === "b2b" ? "Nome da sua marca" : "Seu nome"}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" autoComplete="email" value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pw">Senha</Label>
                  <Input id="su-pw" type="password" autoComplete="new-password" value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
                  {loading ? "Criando…" : !fromInvite && accountType === "b2b" ? "Criar conta da marca" : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Acesso imediato. Sem confirmação por email.
        </p>
      </div>
    </main>
  );
}

function AccountTypeOption({
  active, onClick, icon: Icon, title, desc,
}: {
  active: boolean; onClick: () => void; icon: any; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-all",
        active
          ? "border-primary bg-brand-soft ring-2 ring-primary/20"
          : "border-border bg-card hover:bg-secondary/40",
      )}
    >
      <Icon className={cn("h-4 w-4 mb-1.5", active ? "text-primary" : "text-muted-foreground")} />
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
    </button>
  );
}
