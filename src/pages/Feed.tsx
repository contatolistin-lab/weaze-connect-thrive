import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import FeedItem, { Post } from "@/components/feed/FeedItem";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import CreateBrandDialog from "@/components/CreateBrandDialog";
import { Sparkles, Plus, Compass } from "lucide-react";

const PAGE = 8;

export default function Feed() {
  const { tenant, tenants, loading: tLoading } = useTenant();
  const { user, isB2B, isB2C } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const load = useCallback(async (offset = 0) => {
    if (!tenant || loading || done) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_cta(*), profiles:author_id(name, avatar_url)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    setLoading(false);
    if (error) return;
    if (!data || data.length < PAGE) setDone(true);
    setPosts((p) => offset === 0 ? (data as any[]) : [...p, ...(data as any[])]);
  }, [tenant, loading, done]);

  useEffect(() => {
    setPosts([]); setDone(false); setActiveIdx(0);
    if (tenant) {
      load(0);
      if (user) {
        supabase.from("memberships").upsert(
          { user_id: user.id, tenant_id: tenant.id, role: "member" },
          { onConflict: "user_id,tenant_id" } as any,
        ).then(() => {});
      }
    }
  }, [tenant?.id, user?.id]); // eslint-disable-line

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActiveIdx(idx);
          if (idx >= posts.length - 2) load(posts.length);
        }
      });
    }, { root: c, threshold: [0.6] });
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [posts.length, load]);

  if (tLoading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;

  // B2B sem nenhum tenant → mostra prompt para criar marca (uma vez)
  if (!tenant && isB2B && tenants.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6 py-10">
          <div className="max-w-sm w-full text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-brand grid place-items-center mb-5 shadow-elevated">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl mb-2">Bem-vindo</h1>
            <p className="text-muted-foreground mb-6 text-pretty">
              Para começar, crie sua marca. Em segundos você terá um ambiente próprio com feed, comunidade e métricas.
            </p>
            <Button
              size="lg"
              onClick={() => setShowCreate(true)}
              className="w-full bg-brand text-primary-foreground hover:opacity-90 rounded-full"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar minha marca
            </Button>
          </div>
        </main>
        <CreateBrandDialog open={showCreate} onOpenChange={setShowCreate} />
      </div>
    );
  }

  // B2B com tenants mas nenhum selecionado → seleciona o primeiro automaticamente (TenantContext já faz isso, mas fallback)
  // B2C sem tenant → manda explorar comunidades
  if (!tenant) {
    // B2B nunca deve ver "Explorar comunidades" — força criar/selecionar marca
    if (isB2B) {
      return (
        <div className="min-h-[100dvh] flex flex-col bg-background">
          <TopBar />
          <main className="flex-1 grid place-items-center px-6 py-10">
            <div className="max-w-sm w-full text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-soft grid place-items-center mb-5">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-3xl mb-2">Selecione sua marca</h1>
              <p className="text-muted-foreground mb-6 text-pretty">
                Você é dono de uma marca. Acesse o painel para gerenciar conteúdo e métricas.
              </p>
              <Button
                size="lg"
                onClick={() => setShowCreate(true)}
                className="w-full bg-brand text-primary-foreground hover:opacity-90 rounded-full"
              >
                <Plus className="h-5 w-5 mr-2" />Nova marca
              </Button>
            </div>
          </main>
          <CreateBrandDialog open={showCreate} onOpenChange={setShowCreate} />
        </div>
      );
    }
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6 py-10">
          <div className="max-w-sm w-full text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-soft grid place-items-center mb-5">
              <Compass className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl mb-2">Descubra comunidades</h1>
            <p className="text-muted-foreground mb-6 text-pretty">
              Entre em uma comunidade para ver o feed.
            </p>
            <Button asChild size="lg" className="w-full bg-brand text-primary-foreground hover:opacity-90 rounded-full">
              <Link to="/communities">Explorar comunidades</Link>
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div ref={containerRef} className="flex-1 overflow-y-scroll feed-snap scrollbar-hide">
        {posts.length === 0 && !loading && (
          <div className="h-[calc(100dvh-3.5rem)] grid place-items-center px-6 text-center">
            <div>
              <h2 className="font-display text-3xl mb-2">Feed vazio</h2>
              <p className="text-muted-foreground mb-4">Nenhum post disponível ainda.</p>
            </div>
          </div>
        )}
        {posts.map((p, i) => (
          <div key={p.id} ref={(el) => (itemRefs.current[i] = el)} data-idx={i} className="h-[calc(100dvh-3.5rem)] snap-start">
            <FeedItem post={p} active={i === activeIdx} />
          </div>
        ))}
        {loading && <div className="py-6 text-center text-muted-foreground text-sm">Carregando…</div>}
      </div>
      <BottomNav />
    </div>
  );
}
