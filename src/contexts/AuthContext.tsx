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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setAppRole(null);
      }
      // Forçar recomputação do role quando fazer login
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
    if (!user) { setAppRole(null); return; }
    let cancelled = false;
    (async () => {
      // Buscar roles do usuário
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (cancelled) return;
      
      const roles = (data ?? []).map((r) => r.role as AppRole);
      
      // Se não tem role, verificar memberships para determinar
      if (roles.length === 0) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", user.id)
          .limit(1);
        
        if (memberships && memberships.length > 0) {
          const memberRole = memberships[0].role;
          if (memberRole === 'owner') {
            setAppRole('b2c'); // Assume B2C se é owner de comunidade
          } else {
            setAppRole('b2c');
          }
        } else {
          setAppRole('b2c');
        }
      } else {
        // prioridade: admin > b2b > b2c
        const role: AppRole = roles.includes("admin")
          ? "admin"
          : roles.includes("b2b")
            ? "b2b"
            : "b2c";
        setAppRole(role);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider
      value={{
        user, session, loading,
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
