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
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setAppRole(null); return; }
    let cancelled = false;
    (async () => {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id);
      
      if (cancelled) return;
      
      const roles = (memberships ?? []).map((m) => m.role);
      
      let newRole: AppRole | null = null;
      
      if (roles.includes("owner") || roles.includes("admin")) {
        newRole = roles.includes("admin") ? "admin" : "b2b";
      } else if (roles.includes("member")) {
        newRole = "b2c";
      } else {
        newRole = "b2c";
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
      
      // Check both localStorage and sessionStorage for pending invite
      let pendingSlug = localStorage.getItem("pending_invite_slug");
      if (!pendingSlug) {
        pendingSlug = sessionStorage.getItem("pending_invite_slug");
      }
      
      if (pendingSlug) {
        const redirectPath = `/waiting?slug=${pendingSlug}`;
        localStorage.removeItem("pending_invite_slug");
        sessionStorage.removeItem("pending_invite_slug");
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
      
      if (state.isB2B && !state.hasCommunity) {
        setRedirectTo("/create");
        setRedirected(true);
      } else if (!state.isB2B && !state.hasJoinedCommunities) {
        setRedirectTo("/");
        setRedirected(true);
      } else {
        setRedirected(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, appRole, redirected]);

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
