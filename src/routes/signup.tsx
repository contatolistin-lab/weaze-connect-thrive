import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";
import { Field } from "./login";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta na WEAZE" },
      { name: "description", content: "Crie sua conta WEAZE." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { userType } = useCommunity();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    userType.setB2B(false);
    setTimeout(() => nav({ to: "/feed" }), 700);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="px-4 h-14 flex items-center border-b border-border">
        <Link to="/login" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft size={20} />
        </Link>
      </header>
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
        <WeazeLogo size="lg" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Crie sua conta.</h1>
        <p className="mt-1 text-foreground/60">Entre nas comunidades que você ama.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field icon={User} placeholder="Nome da comunidade" />
          <Field icon={Mail} type="email" placeholder="seu@email.com" />
          <Field icon={Lock} type="password" placeholder="Crie uma senha" />
          <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
            Criar conta
          </WButton>
          <p className="text-xs text-center text-foreground/50">
            Ao criar uma conta você concorda com os Termos e Privacidade.
          </p>
        </form>

        <p className="mt-auto text-center text-sm text-foreground/60">
          Já tem conta?{" "}
          <Link to="/login" className="text-[#8800aa] font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
