import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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
  refreshAppRole: () => void;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true,
  appRole: null, isB2B: false, isB2C: false, isAdmin: false,
  userState: null, redirectTo: null,
  signOut: async () => {}, clearRedirect: () => {}, refreshAppRole: () => {},
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
    let isMounted = true;
    let sessionCheckComplete = false;
    
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!isMounted) return;
      const hasSession = !!s?.user;
      setSession(s);
      setUser(s?.user ?? null);
      setRedirected(false);
      if (!hasSession) {
        setAppRole(null);
        setUserState(null);
        setRedirectTo(null);
      }
      if (sessionCheckComplete) {
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      sessionCheckComplete = true;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => { isMounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) {
      setAppRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: mems } = await supabase
          .from("memberships")
          .select("tenant_id, role")
          .eq("user_id", user.id);

        if (cancelled) return;

        const roles = (mems ?? []).map((m) => m.role);
        const isOwnerOrAdmin = roles.includes("owner") || roles.includes("admin");

        let newRole: AppRole | null = null;

        if (isOwnerOrAdmin) {
          newRole = roles.includes("admin") ? "admin" : "b2b";
        } else if (mems && mems.length > 0) {
          newRole = "b2c";
        } else {
          const accountType = (user as any)?.user_metadata?.account_type;
          newRole = accountType === "b2b" ? "b2b" : "b2c";
        }

        setAppRole(newRole);

        const hasCommunity = isOwnerOrAdmin;
        setUserState({
          isB2B: newRole === "b2b" || newRole === "admin",
          hasCommunity,
          hasJoinedCommunities: mems && mems.length > 0,
        });
      } catch (err) {
        console.error("Error fetching memberships:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const refreshAppRole = useCallback(async () => {
    if (!user) return;
    try {
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id, role")
        .eq("user_id", user.id);

      const roles = (mems ?? []).map((m) => m.role);
      const isOwnerOrAdmin = roles.includes("owner") || roles.includes("admin");

      let newRole: AppRole | null = null;
      if (isOwnerOrAdmin) {
        newRole = roles.includes("admin") ? "admin" : "b2b";
      } else {
        newRole = "b2c";
      }

      setAppRole(newRole);

      const hasCommunity = isOwnerOrAdmin;
      setUserState({
        isB2B: hasCommunity,
        hasCommunity,
        hasJoinedCommunities: mems && mems.length > 0,
      });
    } catch (err) {
      console.error("Error refreshing app role:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !appRole || redirected) return;

    let pendingSlug = localStorage.getItem("weaze:pending_invite_slug");
    if (!pendingSlug) {
      pendingSlug = sessionStorage.getItem("weaze:pending_invite_slug");
    }

    if (pendingSlug) {
      setRedirectTo(`/c/${pendingSlug}`);
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
        refreshAppRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
