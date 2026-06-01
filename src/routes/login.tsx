import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na WEAZE" },
      { name: "description", content: "Acesse sua conta WEAZE." },
    ],
  }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { userType } = useCommunity();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    userType.setB2B(true);
    setTimeout(() => nav({ to: "/feed" }), 700);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="px-4 h-14 flex items-center justify-between border-b border-border">
        <Link to="/" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft size={20} />
        </Link>
        <Link to="/b2b/login" className="text-xs font-semibold text-[#630091]">
          Sou uma marca →
        </Link>
      </header>
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
        <WeazeLogo size="lg" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Bem-vindo de volta.</h1>
        <p className="mt-1 text-foreground/60">Entre para continuar nas suas comunidades.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field icon={Mail} type="email" placeholder="seu@email.com" />
          <Field
            icon={Lock}
            type={show ? "text" : "password"}
            placeholder="Sua senha"
            right={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="p-1 text-foreground/50"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-foreground/70">
              <input type="checkbox" className="accent-[#d81e62]" /> Lembrar
            </label>
            <a href="#" className="text-[#630091] font-semibold">
              Esqueci a senha
            </a>
          </div>
          <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
            Entrar
          </WButton>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-foreground/40">
          <span className="h-px bg-border flex-1" /> ou <span className="h-px bg-border flex-1" />
        </div>
        <div className="space-y-2">
          <WButton variant="outline" size="lg" fullWidth>
            Continuar com Google
          </WButton>
          <WButton variant="outline" size="lg" fullWidth>
            Continuar com Apple
          </WButton>
        </div>

        <p className="mt-auto text-center text-sm text-foreground/60">
          Novo por aqui?{" "}
          <Link to="/signup" className="text-[#d81e62] font-semibold">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export function Field({ icon: Icon, right, ...props }: any) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#d81e62] transition-shadow">
      <Icon size={18} className="text-foreground/40" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/40"
      />
      {right}
    </div>
  );
}
