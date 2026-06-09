import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Building2, Globe } from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";
import { Field } from "../login";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/b2b/signup")({
  head: () => ({ meta: [{ title: "WEAZE para marcas — Criar comunidade" }] }),
  component: B2BSignup,
});

function B2BSignup() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { userType } = useCommunity();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    userType.setB2B(true);
    setTimeout(() => nav({ to: "/b2b/dashboard", search: { onboarding: 1 } as any }), 800);
  };
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="absolute inset-x-0 top-0 h-56 bg-brand-gradient" />
      <header className="relative px-4 h-14 flex items-center justify-between text-white">
        <Link to="/" className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </Link>
        <Link to="/signup" className="text-xs font-semibold opacity-90">
          Sou usuário →
        </Link>
      </header>
      <div className="relative flex-1 flex flex-col px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="text-white">
          <WeazeLogo size="lg" />
          <p className="mt-3 text-xs font-semibold tracking-widest uppercase opacity-80">
            WEAZE FOR BRANDS
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Crie sua comunidade.</h1>
          <p className="mt-1 opacity-90 text-sm">
            Em minutos sua marca tem feed, grupos, chat e analytics.
          </p>
        </div>

        <div className="mt-8 bg-white rounded-3xl p-6 shadow-brand">
          <form onSubmit={submit} className="space-y-4">
            <Field icon={Building2} placeholder="Nome da comunidade" />
            <Field icon={Globe} placeholder="@handle" />
            <Field icon={Mail} type="email" placeholder="email@marca.com" />
            <Field icon={Lock} type="password" placeholder="Crie uma senha" />
            <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
              Criar comunidade
            </WButton>
            <p className="text-xs text-center text-foreground/50">
              14 dias grátis no plano Brand. Sem cartão.
            </p>
          </form>
        </div>

        <p className="mt-auto text-center text-sm text-foreground/60">
          Já tem conta?{" "}
          <Link to="/b2b/login" className="text-[#8800aa] font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
