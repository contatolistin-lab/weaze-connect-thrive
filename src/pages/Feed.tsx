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
import { Sparkles, Plus, Play, Video } from "lucide-react";

const PAGE = 8;

export default function Feed() {
  const { tenant, loading: tLoading } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initialized = useRef(false);

  const loadPosts = useCallback(async (offset = 0) => {
    if (!tenant || loading || done) return;
    setLoading(true);
    console.log("Loading posts for tenant:", tenant.id, "offset:", offset);
    
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_cta(*)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    
    setLoading(false);
    if (error) { console.error("Feed load error:", error); return; }
    console.log("Loaded posts with CTAs:", data);
    
    if (!data || data.length < PAGE) setDone(true);
    setPosts((p) => offset === 0 ? (data as any[]) : [...p, ...(data as any[])]);
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
    const existingObs = c.__observer;
    if (existingObs) existingObs.disconnect();
    
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setActiveIdx(idx);
        }
      });
    }, { root: c, threshold: 0.6 });
    
    c.__observer = io;
    
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

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
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
      <BottomNav />
    </div>
  );
}
