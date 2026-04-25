import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, BarChart3, Calendar, ShoppingBag, MessageCircle } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Feed imersivo", desc: "Vídeo-first, autoplay, swipe vertical, like com toque duplo." },
  { icon: ShoppingBag, title: "Conversão nativa", desc: "CTAs de compra, agenda, orçamento, inscrição e info." },
  { icon: Calendar, title: "Agenda completa", desc: "Regras de disponibilidade, slots, bloqueios e confirmações." },
  { icon: MessageCircle, title: "Conversas e mensagens", desc: "Comunidade pública e chat privado com a marca." },
  { icon: Users, title: "White-label", desc: "Cada marca em ambiente isolado com sua identidade." },
  { icon: BarChart3, title: "Cockpit de dados", desc: "MRR, funil, retenção, churn e exportação." },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand" />
          <span className="font-display text-2xl tracking-tight">Weaze</span>
        </div>
        <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
              <span className="h-px w-8 bg-foreground/40" />
              Comunidade · Conteúdo · Conversão
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1] text-balance mb-6">
              A infraestrutura{" "}
              <span className="text-brand">white-label</span>{" "}
              para marcas com comunidade.
            </h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-xl mb-8">
              Feed imersivo, conversas, mensagens, agenda e dashboard analítico — em um único sistema multi-tenant. Weaze transforma audiência em receita recorrente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand text-primary-foreground hover:opacity-90 shadow-brand">
                <Link to="/auth">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/communities">Explorar comunidades</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="aspect-[9/16] max-w-sm mx-auto rounded-[2rem] bg-foreground shadow-elevated overflow-hidden relative">
              <div className="absolute inset-0 bg-brand opacity-90" />
              <div className="absolute inset-0 bg-overlay" />
              <div className="absolute top-5 left-5 right-5 flex items-center gap-2 text-background">
                <div className="h-7 w-7 rounded-full bg-background/30 backdrop-blur" />
                <span className="text-sm font-semibold">@suamarca</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-background">
                <p className="font-display text-2xl mb-3 leading-tight">Sua próxima coleção. Direto na palma da mão.</p>
                <Button size="sm" className="bg-background text-foreground hover:bg-background/90 rounded-full px-5">Comprar agora</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl mb-12 text-balance max-w-2xl">Tudo que sua marca precisa para crescer com comunidade.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card p-8 hover:bg-secondary/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-brand-soft grid place-items-center mb-4">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                </div>
                <h3 className="font-display text-xl mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Weaze</span>
          <span>Construído como infraestrutura.</span>
        </div>
      </footer>
    </main>
  );
}
