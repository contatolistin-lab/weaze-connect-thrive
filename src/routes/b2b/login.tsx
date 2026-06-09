import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Building2 } from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";
import { Field } from "../login";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/b2b/login")({
  head: () => ({ meta: [{ title: "WEAZE para marcas — Entrar" }] }),
  component: B2BLogin,
});

function B2BLogin() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { userType } = useCommunity();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    userType.setB2B(true);
    setTimeout(() => nav({ to: "/b2b/dashboard" }), 700);
  };
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="absolute inset-x-0 top-0 h-48 bg-brand-gradient" />
      <header className="relative px-4 h-14 flex items-center justify-between text-white">
        <Link to="/" className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </Link>
        <Link to="/login" className="text-xs font-semibold opacity-90">
          Sou usuário →
        </Link>
      </header>
      <div className="relative flex-1 flex flex-col px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="text-white">
          <WeazeLogo size="lg" />
          <p className="mt-3 text-xs font-semibold tracking-widest uppercase opacity-80">
            WEAZE FOR BRANDS
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Acessar painel da marca.</h1>
        </div>

        <div className="mt-8 bg-white rounded-3xl p-6 shadow-brand">
          <form onSubmit={submit} className="space-y-4">
            <Field icon={Building2} placeholder="Nome da comunidade" />
            <Field icon={Mail} type="email" placeholder="email@marca.com" />
            <Field icon={Lock} type="password" placeholder="Senha" />
            <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
              Entrar como marca
            </WButton>
          </form>
        </div>

        <p className="mt-auto text-center text-sm text-foreground/60">
          Nova marca?{" "}
          <Link to="/b2b/signup" className="text-[#8800aa] font-semibold">
            Criar comunidade
          </Link>
        </p>
      </div>
    </div>
  );
}
