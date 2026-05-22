import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
  const nav = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null);
  const [activeLiveUrl, setActiveLiveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);

  const loadPosts = useCallback(async (offset = 0) => {
    if (!tenant || loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      // Fetch posts
      const { data, error } = await supabase
        .from("posts")
        .select("id, tenant_id, author_id, type, media_url, thumbnail_url, description, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE - 1);

      if (error) return;

      if (!data || data.length === 0) {
        doneRef.current = true;
        setDone(true);
        setPosts([]);
        return;
      }

      // Fetch CTAs for all posts
      const postIds = data.map(p => p.id);

      let ctas: any[] = [];
      if (postIds.length > 0) {
        const { data: ctasData } = await supabase
          .from("post_cta")
          .select("*")
          .in("post_id", postIds);
        ctas = ctasData || [];
      }

      // Map CTAs to posts
      const ctaMap: Record<string, any> = {};
      ctas.forEach((c: any) => {
        ctaMap[c.post_id] = c;
      });

      const postsWithCtas = data.map(p => ({
        ...p,
        post_cta: ctaMap[p.id] ? [ctaMap[p.id]] : []
      }));

      if (data.length < PAGE) {
        doneRef.current = true;
        setDone(true);
      }
      setPosts((p) => offset === 0 ? postsWithCtas : [...p, ...postsWithCtas]);
      console.log("[Feed] Posts loaded:", data.map(p => ({ id: p.id, author_id: p.author_id, user_id: user?.id })));
    } catch (err) {
      console.error("[Feed] Error loading posts:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tenant?.id]);

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

  // Load pinned post and check for active live
  useEffect(() => {
    if (!tenant) return;
    (async () => {
      try {
        // First check the lives table for active lives
        const { data: liveData } = await supabase
          .from("lives")
          .select("id, title, external_url, is_live")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Check for live CTA in posts
        const { data: liveCta } = await supabase
          .from("post_cta")
          .select("post_id, config_json")
          .eq("tenant_id", tenant.id)
          .eq("type", "live")
          .order("created_at", { ascending: false })
          .limit(5);

        let liveUrl = null;

        // Priority 1: Check for active live in lives table
        const activeLive = (liveData || []).find(l => l.is_live);
        if (activeLive) {
          liveUrl = activeLive.external_url;
        }

        // Priority 2: Check for any live CTA
        if (!liveUrl && liveCta && liveCta.length > 0) {
          for (const cta of liveCta) {
            try {
              const config = typeof cta.config_json === 'string' ? JSON.parse(cta.config_json) : cta.config_json;
              if (config?.external_url) {
                liveUrl = config.external_url;
                break;
              }
            } catch (e) {
              console.error("Error parsing CTA config:", e);
            }
          }
        }

        console.log("Live check - tenant:", tenant.name, "has live:", !!liveUrl);
        setActiveLiveUrl(liveUrl);
      } catch (err) {
        console.error("[Feed] Error checking live:", err);
      }
    })();
  }, [tenant?.id]);

  // Initial load only — initialLoadDone is set to true SYNCHRONOUSLY
  // so "Carregando..." never gets stuck waiting on loadPosts.
  // Posts populate asynchronously in the background.
  useEffect(() => {
    if (!tenant) {
      setInitialLoadDone(true);
      return;
    }
    doneRef.current = false;
    loadingRef.current = false;
    setPosts([]); setDone(false); setActiveIdx(0);
    setInitialLoadDone(true);
    loadPosts(0);
  }, [tenant?.id, loadPosts]);

  // Refresh on query param
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && tenant) {
      doneRef.current = false;
      loadingRef.current = false;
      setPosts([]); setDone(false);
      loadPosts(0);
    }
  }, [searchParams.get("t"), tenant?.id, loadPosts]);

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

  if (tLoading || !initialLoadDone) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;

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
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      {/* Live indicator at top when there's an active live */}
      {activeLiveUrl && (
        <button
          type="button"
          onClick={() => {
            const fullUrl = activeLiveUrl.startsWith("http") ? activeLiveUrl : `https://${activeLiveUrl}`;
            window.location.href = fullUrl;
          }}
          className="mx-3 mt-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg animate-pulse hover:bg-red-500/20 transition w-full text-left"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="text-sm font-semibold text-red-500">Há uma live acontecendo agora!</span>
          <span className="text-xs text-red-400 ml-auto">Assistir agora →</span>
        </button>
      )}
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
              <h2 className="font-display text-3xl mb-2">Sua comunidade ainda não possui conteúdo</h2>
              <p className="text-muted-foreground">Os conteúdos aparecerão aqui assim que forem publicados.</p>
              {isB2B && (
                <Button 
                  size="lg" 
                  onClick={() => nav("/create")}
                  className="mt-6 bg-brand text-primary-foreground hover:opacity-90 rounded-full"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar primeiro post
                </Button>
              )}
            </div>
          </div>
        )}
        {posts.map((p, i) => (
          <div key={p.id} ref={(el) => (itemRefs.current[i] = el)} data-idx={i} className="h-[calc(100dvh-3.5rem)] snap-start">
            <FeedItem post={p} active={i === activeIdx} onDelete={() => setPosts(current => current.filter(post => post.id !== p.id))} />
          </div>
        ))}
        {loading && <div className="py-6 text-center text-muted-foreground text-sm">Carregando…</div>}
      </div>
      
      <BottomNav />
    </div>
  );
}
