import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserState, UserState } from "@/lib/userState";

export type AppRole = "admin" | "b2b" | "b2c";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  appRole: AppRole | null;
  isB2B: boolean;
  isB2C: boolean;
  isAdmin: boolean;
  userState: UserState | null;
  redirectTo: string | null;
  signOut: () => Promise<void>;
  clearRedirect: () => void;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true,
  appRole: null, isB2B: false, isB2C: false, isAdmin: false,
  userState: null, redirectTo: null,
  signOut: async () => {}, clearRedirect: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setAppRole(null);
        setUserState(null);
        setRedirectTo(null);
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
    if (!user) { setAppRole(null); return; }
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
        // Sem role explícita → verificar se é owner de alguma marca → B2B
        const { data: memberships } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", user.id);
        
        newRole = (memberships && memberships.length > 0 && memberships[0].role === 'owner') ? 'b2b' : 'b2c';
      } else {
        newRole = roles.includes("admin")
          ? "admin"
          : roles.includes("b2b")
            ? "b2b"
            : "b2c";
      }
      
      if (!cancelled) {
        setAppRole(newRole);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Buscar estado do usuário e definir redirecionamento
  useEffect(() => {
    if (!user || !appRole || redirected) return;
    
    let cancelled = false;
    (async () => {
      const state = await getUserState(user.id);
      if (cancelled) return;
      
      setUserState(state);
      
      // Verificar pending invite primeiro
      const pendingSlug = localStorage.getItem("pending_invite_slug");
      if (pendingSlug) {
        // Não redirecionar, o sistema de convite vai lidar com isso
        setRedirected(true);
        return;
      }
      
      // Definir redirecionamento apenas uma vez por sessão
      if (state.isB2B && !state.hasCommunity) {
        setRedirectTo("/create");
        setRedirected(true);
      } else if (!state.isB2B && state.hasJoinedCommunities) {
        // B2C com comunidade - vai para o feed da comunidade selecionada
        setRedirected(true);
      }
      // B2C sem comunidade nenhuma será direcionado pelo InviteLanding
    })();
    
    return () => { cancelled = true; };
  }, [user, appRole]);

  const signOut = async () => { 
    setRedirected(false);
    setRedirectTo(null);
    await supabase.auth.signOut(); 
  };

  const clearRedirect = () => {
    setRedirectTo(null);
  };

  return (
    <Ctx.Provider
      value={{
        user, session, loading,
        appRole,
        isB2B: appRole === "b2b" || appRole === "admin",
        isB2C: appRole === "b2c",
        isAdmin: appRole === "admin",
        userState,
        redirectTo,
        signOut,
        clearRedirect,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
