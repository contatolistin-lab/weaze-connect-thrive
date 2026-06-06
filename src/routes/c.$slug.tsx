import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Home, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { WButton } from "@/components/weaze/WButton";
import { useCommunity } from "@/lib/community-store";
import { z } from "zod";
import { communities } from "@/lib/mock-data";

const CSearchSchema = z.object({
  name: z.string().optional(),
  desc: z.string().optional(),
});

export const Route = createFileRoute("/c/$slug")({
  validateSearch: CSearchSchema,
  head: () => ({ meta: [{ title: "Comunidade — WEAZE" }] }),
  component: CommunityEntry,
});

function CommunityEntry() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const nav = useNavigate();
  const { auth, userType } = useCommunity();

  let community: { name: string; description: string } | null = null;

  // 1. Try localStorage (same browser that created the invite)
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("weaze_community_invites");
      if (raw) {
        const map = JSON.parse(raw);
        community = map[slug] ?? null;
      }
    }
  } catch {}

  // 2. Fallback to URL query params (cross-device share links)
  if (!community && search.name) {
    community = { name: search.name, description: search.desc || "" };
  }

  // 3. Fallback to mock communities by slug
  if (!community) {
    const match = communities.find(
      (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug,
    );
    if (match) {
      community = { name: match.name, description: match.description };
    }
  }

  if (!community) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-extrabold">Link inválido</h1>
          <p className="text-sm text-foreground/60">Este link de comunidade não existe ou expirou.</p>
          <WButton variant="gradient" onClick={() => nav({ to: "/" })}>
            <Home size={16} /> Ir para o Início
          </WButton>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <CommunitySignup community={community} slug={slug} />;
  }

  // Ensure B2C mode when visiting a community share link
  userType.setB2B(false);

  return (
    <div className="min-h-dvh bg-background grid place-items-center px-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="h-20 w-20 mx-auto rounded-full bg-brand-gradient grid place-items-center text-white text-3xl font-extrabold">
          {community.name.charAt(0).toUpperCase()}
        </div>

        <h1 className="text-2xl font-extrabold">{community.name}</h1>

        {community.description && (
          <p className="text-sm text-foreground/60 leading-relaxed">
            {community.description}
          </p>
        )}

        <div className="bg-brand-gradient-soft rounded-2xl p-4">
          <p className="text-sm text-foreground/80 font-semibold">
            Você já está logado. Acesse o feed da comunidade.
          </p>
        </div>

        <WButton variant="gradient" fullWidth onClick={() => nav({ to: "/feed", search: { comunidade: slug } })}>
          <ArrowRight size={18} /> Ir para o Feed
        </WButton>
      </div>
    </div>
  );
}

function CommunitySignup({
  community,
  slug,
}: {
  community: { name: string; description: string };
  slug: string;
}) {
  const nav = useNavigate();
  const { auth, userType } = useCommunity();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function saveB2CCommunity(name: string) {
    try {
      localStorage.setItem("weaze_b2c_community", JSON.stringify({ slug, name }));
    } catch {}
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    auth.signup(name.trim(), email.trim(), password.trim());
    userType.setB2B(false);
    saveB2CCommunity(community.name);
    setTimeout(() => nav({ to: "/feed", search: { comunidade: slug } }), 400);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    const ok = auth.login(email.trim(), password.trim());
    if (ok) {
      userType.setB2B(false);
      saveB2CCommunity(community.name);
      setTimeout(() => nav({ to: "/feed", search: { comunidade: slug } }), 400);
    } else {
      setError("Email ou senha inválidos.");
      setLoading(false);
    }
  };

  if (mode === "login") {
    return (
      <div className="min-h-dvh bg-white flex flex-col">
        <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
          <div className="h-16 w-16 mx-auto rounded-full bg-brand-gradient grid place-items-center text-white text-2xl font-extrabold">
            {community.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-center">
            {community.name}
          </h1>
          <p className="mt-1 text-foreground/60 text-center text-sm">{community.description}</p>
          <p className="mt-6 text-sm font-semibold text-foreground/70">Faça login para entrar</p>

          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
              <Mail size={18} className="text-foreground/40 shrink-0" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
              <Lock size={18} className="text-foreground/40 shrink-0" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="p-1 text-foreground/50 shrink-0"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-xs text-[#630091] font-semibold">{error}</p>}
            <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
              Entrar na Comunidade
            </WButton>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Novo por aqui?{" "}
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); }}
              className="text-[#630091] font-semibold underline"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
        <div className="h-16 w-16 mx-auto rounded-full bg-brand-gradient grid place-items-center text-white text-2xl font-extrabold">
          {community.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-center">
          {community.name}
        </h1>
        <p className="mt-1 text-foreground/60 text-center text-sm">{community.description}</p>
        <p className="mt-6 text-sm font-semibold text-foreground/70">Entre na comunidade</p>

        <form onSubmit={handleSignup} className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
            <User size={18} className="text-foreground/40 shrink-0" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
            <Mail size={18} className="text-foreground/40 shrink-0" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="seu@email.com"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-12 focus-within:ring-2 focus-within:ring-[#630091] transition-shadow">
            <Lock size={18} className="text-foreground/40 shrink-0" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="p-1 text-foreground/50 shrink-0"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <WButton type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
            Entrar na Comunidade
          </WButton>
          <p className="text-xs text-center text-foreground/50">
            Ao criar uma conta você concorda com os Termos e Privacidade.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Já tem conta?{" "}
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className="text-[#630091] font-semibold underline"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
