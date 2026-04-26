import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "b2b" | "b2c";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  appRole: AppRole | null;
  isB2B: boolean;
  isB2C: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true,
  appRole: null, isB2B: false, isB2C: false, isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setRoleLoading(!s?.user);
      if (!s?.user) {
        setAppRole(null);
      }
      if (s?.user) {
        setTimeout(() => setUser(s?.user ?? null), 100);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Buscar papel do usuário (b2b / b2c / admin)
  useEffect(() => {
    if (!user) { setAppRole(null); setRoleLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (cancelled) return;
      
      const roles = (data ?? []).map((r) => r.role as AppRole);
      
      let newRole: AppRole | null = null;
      
      if (roles.length === 0) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", user.id)
          .limit(1);
        
        if (memberships && memberships.length > 0) {
          newRole = memberships[0].role === 'owner' ? 'b2c' : 'b2c';
        } else {
          newRole = 'b2c';
        }
      } else {
        newRole = roles.includes("admin")
          ? "admin"
          : roles.includes("b2b")
            ? "b2b"
            : "b2c";
      }
      
      if (!cancelled) {
        setAppRole(newRole);
        setRoleLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => { await supabase.auth.signOut(); };

  // Não considerar como "pronto" até role estar carregado
  const isReady = !loading && !roleLoading;

  return (
    <Ctx.Provider
      value={{
        user, session, loading: !isReady,
        appRole,
        isB2B: appRole === "b2b" || appRole === "admin",
        isB2C: appRole === "b2c",
        isAdmin: appRole === "admin",
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
