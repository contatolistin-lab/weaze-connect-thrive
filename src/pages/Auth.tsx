import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  account_type: z.enum(["b2b", "b2c"]),
});
const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type AccountType = "b2b" | "b2c";

export default function Auth() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("b2c");
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ ...signup, account_type: accountType });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/communities`,
        data: { name: parsed.data.name, account_type: parsed.data.account_type },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada");
    // B2B vai para criar marca; B2C vai descobrir comunidades
    nav(parsed.data.account_type === "b2b" ? "/onboarding" : "/communities");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(login);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo");
    
    // Todos vão para feed após login
    nav("/feed");
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-xl bg-brand" />
          <span className="font-display text-2xl">Weaze</span>
        </Link>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
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
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">{accountType === "b2b" ? "Nome do responsável" : "Nome"}</Label>
                  <Input id="su-name" maxLength={80} value={signup.name}
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
                  {loading ? "Criando…" : accountType === "b2b" ? "Criar conta da marca" : "Criar conta"}
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
