import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Building2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function AuthB2B() {
  const nav = useNavigate();
  const { loading: authLoading, initializing, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState({ name: "", email: "", password: "" });

  if (initializing || authLoading) {
    return (
      <main className="min-h-screen bg-background grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-t-brand border-brand/20 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </main>
    );
  }

  if (user) {
    nav("/feed", { replace: true });
    return null;
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
        data: { name: parsed.data.name, account_type: "b2b" },
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
    toast.success("Conta criada! Agora crie sua marca.");
    nav("/communities", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginSchema = z.object({
      email: z.string().trim().email("Email inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    });
    const { email, password } = { email: signup.email, password: signup.password };
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) { setLoading(false); toast.error(error.message); return; }

    setLoading(false);
    toast.success("Bem-vindo!");
    nav("/feed", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <Link to="/" className="flex items-center justify-center mb-10">
          <Logo size={160} />
        </Link>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold text-lg">Criar minha marca</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Crie uma conta de marca para gerenciar sua comunidade, métricas e membros.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="su-name">Nome da marca / responsável</Label>
              <Input 
                id="su-name" 
                maxLength={80} 
                value={signup.name} 
                placeholder="Nome da sua marca"
                onChange={(e) => setSignup({ ...signup, name: e.target.value })} 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-email">Email</Label>
              <Input 
                id="su-email" 
                type="email" 
                autoComplete="email" 
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })} 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw">Senha</Label>
              <Input 
                id="su-pw" 
                type="password" 
                autoComplete="new-password" 
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })} 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand text-primary-foreground hover:opacity-90">
              {loading ? "Criando…" : "Criar conta da marca"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="li-email">Email</Label>
              <Input 
                id="li-email" 
                type="email" 
                autoComplete="email" 
                value={signup.email}
                placeholder="Já tenho conta"
                onChange={(e) => setSignup({ ...signup, email: e.target.value })} 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="li-pw">Senha</Label>
              <Input 
                id="li-pw" 
                type="password" 
                autoComplete="current-password" 
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })} 
              />
            </div>
            <Button type="submit" variant="outline" disabled={loading} className="w-full">
              Entrar com minha marca
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/auth" className="underline">Voltar para login</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Acesso imediato. Sem confirmação por email.
        </p>
      </div>
    </main>
  );
}