import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Users,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Plus,
  Share2,
  Sparkles,
  Heart,
  X,
} from "lucide-react";
import { WeazeLogo } from "@/components/weaze/WeazeLogo";
import { WButton } from "@/components/weaze/WButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WEAZE — Transforme sua audiência em comunidade" },
      {
        name: "description",
        content:
          "Feed, mensagens, agenda e dados em um único app com a sua marca. Pare de depender de algoritmos.",
      },
      { property: "og:title", content: "WEAZE — Sua comunidade, sua marca, sua receita" },
      {
        property: "og:description",
        content: "Construa um ativo que é só seu. Chega de depender de algoritmo.",
      },
    ],
  }),
  component: LandingPage,
});

const peopleImages = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80",
  "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80",
];

const groupImages = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&q=80",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80",
];

function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 h-16">
          <WeazeLogo size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <a href="#problema" className="hover:text-foreground">Problema</a>
            <a href="#funciona" className="hover:text-foreground">Como funciona</a>
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <WButton variant="ghost" size="sm">Entrar</WButton>
            </Link>
            <Link to="/b2b/signup">
              <WButton variant="gradient" size="sm">Criar comunidade</WButton>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-50 via-white to-white pointer-events-none" />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center relative">
          <div className="relative">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-white border border-border rounded-full px-3 py-1.5 shadow-soft">
              <Sparkles size={14} className="text-[#d81e62]" /> Sua comunidade, sua marca
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Transforme sua audiência em uma{" "}
              <span className="text-brand-gradient">comunidade que gera receita</span>.
            </h1>
            <p className="mt-5 text-base md:text-lg text-foreground/70 max-w-xl leading-relaxed">
              Feed, mensagens, agenda e dados em um único app com a sua marca. Pare de depender de
              algoritmos — construa um ativo que é só seu.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/b2b/signup">
                <WButton variant="gradient" size="xl">
                  Criar minha comunidade <ArrowRight size={18} />
                </WButton>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-foreground/60">
              <div className="flex -space-x-2">
                {peopleImages.slice(0, 4).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span>
                <b className="text-foreground">+12k</b> marcas já estão dentro
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto">
            <div className="relative w-[300px] h-[600px] rounded-[44px] bg-black p-3 shadow-brand">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 bg-black rounded-full z-10" />
              <div className="relative h-full w-full rounded-[34px] overflow-hidden bg-white">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 pt-6 pb-2">
                    <span className="font-extrabold text-sm">Comunidade</span>
                    <span className="text-xs text-foreground/50">Seguindo</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
                    <img
                      src={groupImages[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={peopleImages[0]}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold">Marina Costa</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Novo encontro presencial esse fds! Quem vem? 🎉
                    </p>
                    <div className="flex items-center gap-4 text-foreground/50">
                      <Heart size={14} />
                      <span className="text-[10px]">234</span>
                      <MessageCircle size={14} />
                      <span className="text-[10px]">18</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -right-16 top-20 hidden md:block bg-white rounded-2xl shadow-brand px-4 py-3 border border-border">
              <p className="text-xs font-semibold text-foreground/60">Engajamento</p>
              <p className="text-lg font-extrabold text-green-600">+312%</p>
              <p className="text-[10px] text-foreground/50">em 30 dias</p>
            </div>
            <div className="absolute -left-16 bottom-32 hidden md:block bg-white rounded-2xl shadow-brand px-4 py-3 border border-border">
              <div className="flex items-center gap-2">
                <img
                  src={peopleImages[1]}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs font-semibold">Novo membro</p>
                  <p className="text-[10px] text-foreground/50">@ana acabou de entrar</p>
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 bg-brand-gradient opacity-20 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problema" className="bg-[#fafafa] border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1.5">
              <X size={14} /> O problema
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight">
              As redes sociais sabotam seu negócio.
            </h2>
            <p className="mt-3 text-foreground/70 max-w-xl mx-auto">
              Você está construindo a audiência de outra pessoa. A qualquer momento, as regras mudam
              e tudo pode desaparecer.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              {
                t: "Você depende do algoritmo",
                d: "Seu alcance é controlado pela plataforma. A cada mudança de feed, menos pessoas veem seu conteúdo.",
              },
              {
                t: "Não consegue manter contato",
                d: "Após publicar, não há como falar diretamente com quem te seguiu.",
              },
              {
                t: "Seguidores não viram clientes",
                d: "Você tem atenção, mas converter em venda é difícil. O link no bio não é suficiente.",
              },
              {
                t: "Sua marca se perde no meio",
                d: "No feed, sua marca compete com centenas de outras. É difícil se destacar.",
              },
              {
                t: "Sem dados reais",
                d: "Você não sabe quem é sua audiência de verdade. Não consegue medir retenção.",
              },
              {
                t: "Precisa de várias ferramentas",
                d: "Você usa Instagram, WhatsApp, Calendly, Shopify. Tudo separado.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-3xl p-7 bg-white border border-border shadow-soft hover:shadow-brand transition-shadow"
              >
                <h3 className="font-bold text-base">{item.t}</h3>
                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONEXÃO REAL */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Conexão real
          </h2>
          <p className="mt-3 text-foreground/70">
            Comunidade não é número de seguidores. É relacionamento.
            <br />
            A weaze foi feita para criar momentos de verdade entre você e quem te acompanha — sem
            ruído, sem distração, sem disputa por atenção.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {[
            { icon: Heart, t: "Conexões reais", d: "Pessoas que voltam todo dia." },
            { icon: Sparkles, t: "Conteúdo próprio", d: "Sua marca em primeiro plano." },
            { icon: MessageCircle, t: "Conversas ativas", d: "Sem algoritmo no meio." },
            { icon: Users, t: "Audiência fiel", d: "Seu ativo, sua regra." },
          ].map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-3xl p-7 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 text-center"
            >
              <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white mx-auto">
                <Icon size={24} />
              </span>
              <h3 className="mt-4 font-extrabold text-lg">{t}</h3>
              <p className="mt-2 text-sm text-foreground/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="funciona" className="bg-[#fafafa] border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Como funciona
            </h2>
            <p className="mt-3 text-foreground/70">Comece em minutos.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                t: "Crie sua marca",
                d: "Escolha o nome da sua comunidade e carregue seu logo.",
                img: groupImages[0],
              },
              {
                n: "02",
                t: "Convide membros",
                d: "Compartilhe o link com quem já te segue. Cada pessoa que entra vira membro.",
                img: groupImages[1],
              },
              {
                n: "03",
                t: "Publique e engaje",
                d: "Crie posts, vídeos e fotos. Tudo num só lugar para sua comunidade.",
                img: groupImages[2],
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-3xl bg-white border border-border shadow-soft overflow-hidden"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={step.img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-7">
                  <span className="text-4xl font-black text-brand-gradient opacity-30">
                    {step.n}
                  </span>
                  <h3 className="mt-1 font-extrabold text-lg">{step.t}</h3>
                  <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            O que você ganha
          </h2>
          <p className="mt-3 text-foreground/70">
            Tudo que você precisa.
            <br />
            Uma plataforma completa com as ferramentas que sua comunidade precisa.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, t: "Feed", d: "Posts em vídeo, imagem ou texto com links" },
            { icon: MessageCircle, t: "Conversas", d: "Interaja diretamente com seu cliente" },
            { icon: Users, t: "Grupos", d: "Conversas mais próximas em grupos fechados" },
            { icon: Plus, t: "Criar", d: "Adicione fotos e vídeos" },
            { icon: BarChart3, t: "Métricas", d: "Acompanhe o engajamento e gamifique" },
            { icon: Share2, t: "Compartilhar", d: "Link para convidar pessoas e clientes" },
          ].map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-2xl p-5 bg-white border border-border shadow-soft hover:shadow-brand transition-shadow"
            >
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white mb-3">
                <Icon size={18} />
              </span>
              <h3 className="font-bold text-sm">{t}</h3>
              <p className="mt-1 text-xs text-foreground/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="bg-brand-gradient text-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Para quem é
            </h2>
            <p className="mt-3 text-white/80">
              Para marcas que levam relacionamento a sério.
              <br />
              Qualquer pessoa ou marca que quer construir algo que dura, sem depender de plataformas.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { n: "1", t: "Creators", d: "Transforme seguidores em membros pagantes" },
              { n: "2", t: "E-commerces", d: "Clientes fiéis geram recompra" },
              { n: "3", t: "Coaches", d: "Acompanhamento completo" },
              { n: "4", t: "Cursos", d: "Alunos mais engajados" },
              { n: "5", t: "Serviços", d: "Agenda e histórico facilitado" },
              { n: "6", t: "Comunidades", d: "Network orgânico" },
            ].map((item) => (
              <div
                key={item.n}
                className="rounded-3xl p-7 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-colors"
              >
                <span className="text-3xl font-black opacity-40">{item.n}</span>
                <h3 className="mt-2 font-extrabold text-xl">{item.t}</h3>
                <p className="mt-2 text-sm text-white/80">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Weaze vs Redes Sociais
          </h2>
        </div>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 pr-8 font-semibold text-foreground/50">Recurso</th>
                <th className="text-center py-4 px-6 font-semibold text-foreground/50">Redes</th>
                <th className="text-center py-4 px-6 font-semibold text-brand-gradient">Weaze</th>
              </tr>
            </thead>
            <tbody>
              {[
                { r: "Feed próprio", rede: "❌", weaze: "✅" },
                { r: "Mensagens da marca", rede: "❌", weaze: "✅" },
                { r: "Agenda integrada", rede: "❌", weaze: "✅" },
                { r: "Dados da audiência", rede: "❌", weaze: "✅" },
                { r: "Membros ilimitados", rede: "❌", weaze: "✅" },
                { r: "Sem algoritmos", rede: "❌", weaze: "✅" },
                { r: "Sua marca", rede: "❌", weaze: "✅" },
              ].map((row) => (
                <tr key={row.r} className="border-b border-border/50">
                  <td className="py-4 pr-8 font-medium">{row.r}</td>
                  <td className="text-center py-4 px-6 text-lg">{row.rede}</td>
                  <td className="text-center py-4 px-6 text-lg">{row.weaze}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* POR QUE AGORA */}
      <section className="bg-[#fafafa] border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Por que agora
            </h2>
            <p className="mt-3 text-foreground/70">
              O jogo mudou. E a sua marca também precisa mudar.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                t: "Sua audiência já existe.",
                d: "Falta a estrutura certa para transformar atenção em receita.",
              },
              {
                t: "Pare de depender só de redes sociais.",
                d: "Algoritmos mudam. Sua comunidade fica com você.",
              },
              {
                t: "Construa um ativo próprio.",
                d: "Dados, relacionamento e marca — tudo na sua mão.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-3xl p-8 bg-white border border-border shadow-soft"
              >
                <h3 className="font-extrabold text-lg">{item.t}</h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Invista na sua comunidade
          </h2>
          <p className="mt-3 text-foreground/70">
            Mesmo acesso completo em ambos os planos. A diferença é apenas o compromisso — e a
            economia.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Annual */}
          <div className="rounded-3xl p-8 bg-brand-gradient text-white shadow-brand relative order-2 md:order-1">
            <span className="absolute -top-3 right-6 bg-white text-[#d81e62] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              MAIS ESCOLHIDO
            </span>
            <p className="text-sm font-semibold opacity-80">Plano Anual</p>
            <p className="text-xs opacity-70 mt-1">Melhor custo-benefício</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">R$</span>
              <span className="text-5xl font-extrabold tracking-tight">87</span>
            </div>
            <p className="text-sm opacity-80">em 10x</p>
            <p className="mt-1 text-sm opacity-70">Receba 12 meses de acesso</p>
            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-3">
              <p className="text-sm font-bold">Economize R$ 654</p>
              <p className="text-xs opacity-80">🎁 Ganhe 2 meses grátis</p>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {["Todos os recursos da plataforma", "Comunidade ilimitada", "Feed completo", "Mensagens", "Grupos", "Conteúdos"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={16} className="shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs opacity-70">Mesmo acesso completo. Melhor custo-benefício.</p>
            <p className="mt-1 text-xs opacity-60">Ideal para quem quer crescer e construir sua comunidade no longo prazo.</p>
            <div className="mt-6">
              <Link to="/b2b/signup">
                <WButton variant="white" fullWidth>
                  Escolher plano anual
                </WButton>
              </Link>
            </div>
          </div>

          {/* Monthly */}
          <div className="rounded-3xl p-8 bg-white border border-border shadow-soft order-1 md:order-2">
            <p className="text-sm font-semibold text-foreground/70">Plano Mensal</p>
            <p className="text-xs text-foreground/50 mt-1">Sem compromisso</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">R$</span>
              <span className="text-5xl font-extrabold tracking-tight text-foreground">127</span>
            </div>
            <p className="text-sm text-foreground/60">/mês</p>
            <p className="mt-2 text-sm text-foreground/50">Mesmo acesso completo. Sem compromisso.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Todos os recursos da plataforma", "Comunidade ilimitada", "Feed completo", "Mensagens", "Grupos", "Conteúdos"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={16} className="text-[#d81e62] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-foreground/50">Cancele quando quiser</p>
            <p className="mt-1 text-xs text-foreground/50">Ideal para quem deseja começar sem compromisso.</p>
            <div className="mt-6">
              <Link to="/b2b/signup">
                <WButton variant="gradient" fullWidth>
                  Começar agora
                </WButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-brand-gradient text-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Pronto para começar
          </h2>
          <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Comece hoje a transformar sua audiência em receita recorrente.
          </p>
          <p className="mt-2 text-sm text-white/60 max-w-lg mx-auto">
            Sem mensalidade por usuário. Sem letra miúda. Apenas a estrutura certa para o próximo
            passo da sua marca.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/b2b/signup">
              <WButton variant="white" size="xl">
                Criar minha comunidade <ArrowRight size={18} />
              </WButton>
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">Grátis para começar · Sem cartão de crédito</p>
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
                    <a href="#" className="hover:text-foreground">{i}</a>
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
