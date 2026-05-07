import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Search, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { getAccessStatus, requestAccess } from "@/lib/communityAccess";

type TenantCard = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  member_count?: number;
  last_post_at?: string | null;
};

export default function Communities() {
  const { user, signOut, isB2B } = useAuth();
  const { tenants, selectTenant, isOwner } = useTenant();
  const nav = useNavigate();
  const [discover, setDiscover] = useState<TenantCard[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false }).limit(40);
      setDiscover((data ?? []) as TenantCard[]);
      setLoading(false);
    })();
  }, []);

  const myIds = new Set(tenants.map((t) => t.id));
  const filtered = discover.filter(
    (t) => !myIds.has(t.id) && t.name.toLowerCase().includes(query.toLowerCase()),
  );

  const enter = async (id: string) => {
    if (!user) { nav("/auth"); return; }

    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;

    if (isB2B) {
      selectTenant(id);
      nav("/feed");
      return;
    }

    const status = await getAccessStatus(tenant.id, user.id);

    if (status === "approved") {
      selectTenant(id);
      nav("/feed");
    } else {
      selectTenant(id);
      nav(`/c/${tenant.slug}`);
    }
  };

  const join = async (id: string) => {
    if (!user) { nav("/auth"); return; }

    const tenant = discover.find(t => t.id === id);
    if (!tenant) return;

    if (isB2B) {
      selectTenant(id);
      nav("/feed");
      return;
    }

    const status = await getAccessStatus(tenant.id, user.id);

    if (status === "approved") {
      selectTenant(id);
      nav("/feed");
    } else {
      await requestAccess(tenant.id, user.id, user.user_metadata?.name || "", user.email || "");
      selectTenant(id);
      nav(`/c/${tenant.slug}`);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={72} />
          </Link>
          {user ? (
            <Button size="icon" variant="ghost" onClick={async () => { await signOut(); nav("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" asChild><Link to="/auth">Entrar</Link></Button>
          )}
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-3xl">Minhas comunidades</h1>
            {isB2B && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/onboarding"><Plus className="h-4 w-4 mr-1" />Nova marca</Link>
              </Button>
            )}
          </div>

{tenants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-brand-soft grid place-items-center mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isB2B
                  ? "Você ainda não tem uma marca. Crie a sua e comece a publicar."
                  : "Você ainda não participa de nenhuma comunidade. Explore abaixo para entrar."}
              </p>
              {isB2B ? (
                <Button asChild className="bg-brand text-primary-foreground hover:opacity-90">
                  <Link to="/onboarding">Criar minha marca</Link>
                </Button>
              ) : (
                <Button asChild className="bg-brand text-primary-foreground hover:opacity-90">
                  <Link to="/auth">Explorar comunidades</Link>
                </Button>
              )}
            </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isB2B
                  ? "Você ainda não tem uma marca. Crie a sua e comece a publicar."
                  : "Você ainda não participa de nenhuma comunidade. Explore abaixo para entrar."}
              </p>
              {isB2B && (
                <Button asChild className="bg-brand text-primary-foreground hover:opacity-90">
                  <Link to="/onboarding">Criar minha marca</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => enter(t.id)}
                  className="group flex items-center gap-4 bg-card hover:bg-secondary/60 border border-border p-4 rounded-2xl shadow-soft transition-all text-left"
                >
                  <CommunityAvatar tenant={t} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">Toque para entrar</p>
                  </div>
                  <div className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Entrar →
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Descobrir</h2>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar comunidades…"
              className="pl-9 rounded-full"
            />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma comunidade encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col items-center text-center">
                  <CommunityAvatar tenant={t} size={64} />
                  <p className="font-semibold text-sm mt-3 truncate w-full">{t.name}</p>
                  <Button size="sm" onClick={() => join(t.id)} className="mt-3 rounded-full bg-brand text-primary-foreground hover:opacity-90 w-full">
                    <Users className="h-3.5 w-3.5 mr-1" />Entrar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CommunityAvatar({ tenant, size = 48 }: { tenant: { name: string; logo_url: string | null }; size?: number }) {
  if (tenant.logo_url) {
    return <img src={tenant.logo_url} alt={tenant.name} className="rounded-2xl object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-2xl bg-brand grid place-items-center text-primary-foreground font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {tenant.name[0]?.toUpperCase()}
    </div>
  );
}
