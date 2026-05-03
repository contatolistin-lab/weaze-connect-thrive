import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import FeedItem, { Post } from "@/components/feed/FeedItem";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import CreateBrandDialog from "@/components/CreateBrandDialog";
import { Sparkles, Plus, Play, Video, MessageCircle, BarChart3 } from "lucide-react";

const PAGE = 8;

export default function Feed() {
  const { tenant, loading: tLoading } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initialized = useRef(false);

  const loadPosts = useCallback(async (offset = 0) => {
    if (!tenant || loading || done) return;
    setLoading(true);
    console.log("Loading posts for tenant:", tenant.id, "offset:", offset);
    
    // Fetch posts
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    
    setLoading(false);
    if (error) { console.error("Feed load error:", error); return; }
    console.log("Loaded posts:", data);
    
    if (!data || data.length === 0) {
      setDone(true);
      setPosts([]);
      return;
    }
    
    // Fetch CTAs for all posts (including pagination)
    const postIds = data.map(p => p.id);
    console.log("Post IDs:", postIds);
    
    let ctas: any[] = [];
    if (postIds.length > 0) {
      const { data: ctasData } = await supabase
        .from("post_cta")
        .select("*")
        .in("post_id", postIds);
      ctas = ctasData || [];
    }
    
    console.log("Loaded CTAs:", ctas);
    
    // Map CTAs to posts
    const ctaMap: Record<string, any> = {};
    ctas.forEach((c: any) => {
      ctaMap[c.post_id] = c;
    });
    
    const postsWithCtas = data.map(p => ({
      ...p,
      post_cta: ctaMap[p.id] ? [ctaMap[p.id]] : []
    }));
    
    console.log("Posts with CTAs:", postsWithCtas);
    
    if (data.length < PAGE) setDone(true);
    setPosts((p) => offset === 0 ? postsWithCtas : [...p, ...postsWithCtas]);
  }, [tenant?.id, loading, done]);

  // Track view when post becomes active
  const trackView = useCallback(async (postId: string) => {
    if (!user || !tenant) return;
    await supabase.from("interactions").upsert({
      tenant_id: tenant.id,
      user_id: user.id,
      post_id: postId,
      action_type: "view",
    }, { onConflict: "tenant_id,user_id,post_id,action_type" });
  }, [user, tenant]);

  // Load pinned post
  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("posts")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_pinned", true)
        .limit(1)
        .maybeSingle();
      setPinnedPost((data as any) || null);
    })();
  }, [tenant?.id]);

  // Initial load only
  useEffect(() => {
    if (initialized.current || !tenant) return;
    initialized.current = true;
    console.log("Feed initial load, tenant:", tenant.id);
    setPosts([]); setDone(false); setActiveIdx(0);
    loadPosts(0);
  }, [tenant?.id]); // Only run once when tenant changes

  // Refresh on query param
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && tenant) {
      console.log("Force refresh triggered by t param");
      setPosts([]); setDone(false);
      loadPosts(0);
    }
  }, [searchParams.get("t"), tenant?.id]);

  // Re-observe items when posts change
  useEffect(() => {
    const c = containerRef.current;
    if (!c || posts.length === 0) return;
    
    // Disconnect existing observer
    const existingObs = (c as any).__observer as IntersectionObserver | undefined;
    if (existingObs) existingObs.disconnect();
    
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActiveIdx(idx);
        }
      });
    }, { root: c, threshold: 0.6 });
    
    (c as any).__observer = io;
    
    itemRefs.current.forEach((el) => {
      if (el) {
        io.observe(el);
      }
    });
    
    return () => io.disconnect();
  }, [posts.length]);

  if (tLoading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;

  // B2B sem tenant → criar marca
  if (!tenant && isB2B) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-sm w-full text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-brand grid place-items-center mb-6 shadow-elevated">
              <Video className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl mb-3">Crie sua marca</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Publique vídeos, construa comunidade e converta em resultados.
            </p>
            <Button
              size="lg"
              onClick={() => setShowCreate(true)}
              className="w-full bg-brand text-primary-foreground hover:opacity-90 rounded-full h-14 text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar marca
            </Button>
          </div>
        </main>
        <CreateBrandDialog open={showCreate} onOpenChange={setShowCreate} />
      </div>
    );
  }

  // B2C sem tenant → explorar
  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-sm w-full text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-brand-soft grid place-items-center mb-6">
              <Play className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl mb-3">Descubra conteúdo</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Entre em uma comunidade para ver vídeos imersivos.
            </p>
            <Button asChild size="lg" className="w-full bg-brand text-primary-foreground hover:opacity-90 rounded-full h-14 text-lg">
              <Link to="/communities">Explorar comunidades</Link>
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  function FloatingActionButton() {
    const [open, setOpen] = useState(false);

    return (
      <>
        {/* FAB */}
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-brand text-primary-foreground shadow-elevated hover:scale-105 transition-transform z-50 flex items-center justify-center"
          style={{ bottom: 'calc(3.5rem + 16px)' }}
        >
          <Plus className={`h-6 w-6 transition-transform ${open ? 'rotate-45' : ''}`} />
        </button>

        {/* Menu */}
        {open && (
          <div className="fixed bottom-36 right-5 z-40 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
            <Link
              to="/create"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border rounded-full shadow-elevated hover:bg-accent transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Novo post</span>
            </Link>
            <Link
              to="/conversas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border rounded-full shadow-elevated hover:bg-accent transition-colors"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Criar conversa</span>
            </Link>
          </div>
        )}

        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      {pinnedPost && (
        <button
          onClick={() => {
            const c = containerRef.current;
            const target = itemRefs.current.find((el) => el?.dataset.idx === "0");
            if (target && c) c.scrollTo({ top: target.offsetTop, behavior: "smooth" });
          }}
          className="mx-3 mt-2 mb-1 text-left bg-brand-soft border border-brand/20 px-3 py-2 rounded-lg shadow-sm hover:bg-brand-soft/80 transition"
        >
          <p className="text-xs font-semibold text-brand uppercase tracking-wide">📌 Comece por aqui</p>
          <p className="text-sm text-foreground line-clamp-2 mt-0.5">
            {pinnedPost.description || "Confira este conteúdo em destaque"}
          </p>
        </button>
      )}
      <div ref={containerRef} className="flex-1 overflow-y-scroll feed-snap scrollbar-hide">
        {posts.length === 0 && !loading && (
          <div className="h-[calc(100dvh-3.5rem)] grid place-items-center px-6 text-center">
            <div>
              <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="font-display text-3xl mb-2">Feed vazio</h2>
              <p className="text-muted-foreground">Nenhum vídeo disponível ainda.</p>
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
      
      {/* Floating Action Button - Only for B2B */}
      {isB2B && <FloatingActionButton />}
      
      <BottomNav />
    </div>
  );
}
