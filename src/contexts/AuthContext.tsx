import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "b2b" | "b2c";

type UserState = {
  isB2B: boolean;
  hasCommunity: boolean;
  hasJoinedCommunities: boolean;
};

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
  const initialized = useRef(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setRedirected(false);
      if (!s?.user) {
        setAppRole(null);
        setUserState(null);
        setRedirectTo(null);
        setLoading(false);
        initialized.current = false;
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || initialized.current) {
      if (!user) setLoading(false);
      return;
    }
    
    initialized.current = true;
    let cancelled = false;
    
    (async () => {
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id, role")
        .eq("user_id", user.id);
      
      if (cancelled) return;
      
      const roles = (mems ?? []).map((m) => m.role);
      
      let newRole: AppRole | null = null;
      
      if (roles.includes("owner") || roles.includes("admin")) {
        newRole = roles.includes("admin") ? "admin" : "b2b";
      } else {
        newRole = "b2c";
      }
      
      setAppRole(newRole);
      
      const isB2B = roles.includes("owner") || roles.includes("admin");
      setUserState({
        isB2B,
        hasCommunity: isB2B,
        hasJoinedCommunities: mems && mems.length > 0,
      });
      
      setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, [user]);

// Buscar estado do usuário e definir redirecionamento
  useEffect(() => {
    if (!user || !appRole || redirected) return;
    
    // Check for pending invite slug first - invite flow takes priority
    let pendingSlug = localStorage.getItem("pending_invite_slug");
    if (!pendingSlug) {
      pendingSlug = sessionStorage.getItem("pending_invite_slug");
    }
    
    // If user just completed auth and has a pending invite, redirect to invite page
    if (pendingSlug) {
      const redirectPath = `/invite/${pendingSlug}`;
      setRedirectTo(redirectPath);
      setRedirected(true);
      return;
    }
    
    const justJoined = sessionStorage.getItem("just_joined_community");
    if (justJoined) {
      sessionStorage.removeItem("just_joined_community");
      setRedirected(true);
      return;
    }
    
    setRedirected(true);
  }, [user, appRole, redirected]);

  const signOut = async () => { 
    setRedirected(false);
    setRedirectTo(null);
    setAppRole(null);
    setUserState(null);
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
