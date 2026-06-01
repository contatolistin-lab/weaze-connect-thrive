import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Play,
  Check,
} from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WEAZE — Onde marcas viram comunidades" },
      {
        name: "description",
        content:
          "A rede social vertical para criar, escalar e monetizar comunidades de marca. Como o TikTok, mas para comunidades.",
      },
      { property: "og:title", content: "WEAZE — Onde marcas viram comunidades" },
      {
        property: "og:description",
        content: "Crie comunidades, conecte fãs e monetize com o feed vertical da WEAZE.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 h-16">
          <WeazeLogo size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <a href="#feed" className="hover:text-foreground">
              Feed
            </a>
            <a href="#creators" className="hover:text-foreground">
              Criadores
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Planos
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <WButton variant="ghost" size="sm">
                Entrar
              </WButton>
            </Link>
            <Link to="/b2b/signup">
              <WButton variant="gradient" size="sm">
                Criar comunidade
              </WButton>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient-soft pointer-events-none" />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-white border border-border rounded-full px-3 py-1.5 shadow-soft">
              <Sparkles size={14} className="text-[#d81e62]" /> A nova era das comunidades
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Onde marcas viram <span className="text-brand-gradient">comunidades</span> e fãs viram
              tribo.
            </h1>
            <p className="mt-5 text-base md:text-lg text-foreground/70 max-w-xl">
              WEAZE é a rede social vertical para criar, escalar e monetizar comunidades reais. Feed
              estilo TikTok, ferramentas estilo Discord, alcance estilo Instagram.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/b2b/signup">
                <WButton variant="gradient" size="xl">
                  Criar comunidade <ArrowRight size={18} />
                </WButton>
              </Link>
              <Link to="/feed">
                <WButton variant="outline" size="xl">
                  Explorar comunidades
                </WButton>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-foreground/60">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((l, i) => (
                  <span
                    key={l}
                    className="h-8 w-8 rounded-full border-2 border-white grid place-items-center text-white text-xs font-bold"
                    style={{ background: ["#630091", "#d81e62", "#8a2be2", "#ff4d8d"][i] }}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <span>
                <b className="text-foreground">+120k</b> criadores e marcas já dentro
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto">
            <div className="relative w-[300px] h-[600px] rounded-[44px] bg-black p-3 shadow-brand">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 bg-black rounded-full z-10" />
              <div className="relative h-full w-full rounded-[34px] overflow-hidden bg-gradient-to-br from-orange-500 via-pink-500 to-purple-700">
                <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                  <div className="flex items-center justify-between">
                    <WeazeLogo size="sm" />
                    <Play size={20} />
                  </div>
                  <div className="text-7xl text-center">👟</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-9 w-9 rounded-full bg-white/20 grid place-items-center text-sm font-bold">
                        N
                      </span>
                      <div>
                        <p className="text-sm font-bold leading-none">Nike Run Club</p>
                        <p className="text-xs opacity-80">@nikerun · seguir</p>
                      </div>
                    </div>
                    <p className="text-sm leading-snug">Novo drop Pegasus 41 🔥 corra mais leve.</p>
                    <button className="mt-3 w-full bg-white text-[#630091] font-bold rounded-2xl py-2.5 text-sm">
                      Comprar agora
                    </button>
                  </div>
                </div>
                <div className="absolute right-4 bottom-36 flex flex-col gap-4 items-center text-white">
                  {[Heart, MessageCircle, Share2].map((I, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="h-10 w-10 rounded-full bg-white/15 backdrop-blur grid place-items-center">
                        <I size={20} />
                      </span>
                      <span className="text-[10px] mt-1 font-semibold">
                        {["12k", "384", "920"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 bg-brand-gradient opacity-20 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="feed" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Tudo o que sua comunidade precisa.
          </h2>
          <p className="mt-3 text-foreground/70">
            Conexão real, engajamento medido e monetização nativa — num só lugar.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Users,
              t: "Comunidades",
              d: "Reúna fãs em torno da sua marca com perfis, grupos e lives.",
            },
            {
              icon: TrendingUp,
              t: "Engajamento",
              d: "Feed vertical que prende a atenção e converte em ação.",
            },
            {
              icon: Sparkles,
              t: "Monetização",
              d: "Drops, links pagos, assinaturas e analytics em tempo real.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-3xl p-7 bg-white border border-border shadow-soft hover:shadow-brand transition-shadow"
            >
              <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 font-bold text-lg">{t}</h3>
              <p className="mt-2 text-sm text-foreground/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CREATORS strip */}
      <section id="creators" className="bg-brand-gradient text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Para marcas e criadores que querem deixar de ser apenas conteúdo.
            </h2>
            <p className="mt-4 text-white/80">
              Construa uma audiência que pertence a você. Sem algoritmo escondido, sem alcance
              roubado.
            </p>
            <div className="mt-6">
              <Link to="/b2b/signup">
                <WButton variant="white" size="lg">
                  Sou uma marca <ArrowRight size={16} />
                </WButton>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["Nike", "Spotify", "Magalu", "Heineken", "Stone", "Natura"].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-5 font-bold tracking-tight text-lg"
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Planos que escalam com você.
          </h2>
          <p className="mt-3 text-foreground/70">Comece grátis. Pague apenas quando crescer.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            {
              name: "Starter",
              price: "Grátis",
              desc: "Para começar sua comunidade.",
              feats: ["Até 1.000 membros", "Feed vertical", "Chat e grupos"],
            },
            {
              name: "Brand",
              price: "R$ 349/mês",
              desc: "Para marcas que querem escalar.",
              feats: [
                "Membros ilimitados",
                "Analytics avançado",
                "Drops e CTAs nativos",
                "Verificação",
              ],
              featured: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              desc: "Para grandes operações.",
              feats: ["API e integrações", "Suporte dedicado", "SLA premium"],
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-7 border ${p.featured ? "border-transparent bg-brand-gradient text-white shadow-brand" : "bg-white border-border shadow-soft"}`}
            >
              <p className="text-sm font-semibold opacity-80">{p.name}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{p.price}</p>
              <p className={`mt-1 text-sm ${p.featured ? "text-white/80" : "text-foreground/60"}`}>
                {p.desc}
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={16} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Link to="/b2b/signup">
                  <WButton variant={p.featured ? "white" : "gradient"} fullWidth>
                    Começar
                  </WButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-center">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {[
            {
              q: "WEAZE é só para marcas?",
              a: "Não. Criadores, marcas e usuários convivem no mesmo feed — mas com ferramentas separadas.",
            },
            {
              q: "Como funciona o feed?",
              a: "Vertical, infinito e fullscreen — como você já conhece, mas focado em comunidades.",
            },
            {
              q: "Posso monetizar?",
              a: "Sim, com drops, links pagos, assinaturas e métricas em tempo real.",
            },
            { q: "É grátis para começar?", a: "Sim, o plano Starter é gratuito para sempre." },
          ].map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl bg-white border border-border p-5 shadow-soft"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between font-semibold">
                {f.q}
                <span className="text-[#d81e62] group-open:rotate-45 transition-transform text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-foreground/70 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <WeazeLogo size="md" />
            <p className="mt-3 text-sm text-foreground/60 max-w-xs">
              A rede social das comunidades de marca.
            </p>
          </div>
          {[
            { t: "Produto", l: ["Feed", "Comunidades", "Criar", "Planos"] },
            { t: "Marcas", l: ["B2B", "Cases", "Analytics", "API"] },
            { t: "Legal", l: ["Termos", "Privacidade", "Cookies", "Contato"] },
          ].map((c) => (
            <div key={c.t}>
              <p className="font-bold text-sm">{c.t}</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                {c.l.map((i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-foreground">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-foreground/50">
          © 2026 WEAZE. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
