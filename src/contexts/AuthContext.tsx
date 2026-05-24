import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
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
  initializing: boolean;
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
  user: null, session: null, loading: true, initializing: true,
  appRole: null, isB2B: false, isB2C: false, isAdmin: false,
  userState: null, redirectTo: null,
  signOut: async () => {}, clearRedirect: () => {}, refreshAppRole: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setInitializing(false);
      }
    }, 15_000);

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (!data.session) {
          clearTimeout(authTimeout);
          setLoading(false);
          setInitializing(false);
          return;
        }
        
        try {
          const { data: mems } = await supabase
            .from("memberships")
            .select("tenant_id, role")
            .eq("user_id", data.session.user.id);
          
          if (!isMounted) return;
          
          const roles = (mems ?? []).map((m: any) => m.role);
          const isOwnerOrAdmin = roles.includes("owner") || roles.includes("admin");
          const newRole: AppRole | null = isOwnerOrAdmin 
            ? (roles.includes("admin") ? "admin" : "b2b") 
            : (data.session.user.user_metadata?.account_type === "b2b" ? "b2b" : "b2c");
          
          setAppRole(newRole);
          setUserState({
            isB2B: newRole === "b2b" || newRole === "admin",
            hasCommunity: isOwnerOrAdmin,
            hasJoinedCommunities: mems && mems.length > 0,
          });
        } catch (err) {
          console.error("Error fetching memberships:", err);
          if (isMounted) setAppRole("b2c");
        } finally {
          if (isMounted) {
            clearTimeout(authTimeout);
            setLoading(false);
            setInitializing(false);
          }
        }
      } catch (err) {
        console.error("[AuthContext] Fatal error in initAuth:", err);
        if (isMounted) {
          clearTimeout(authTimeout);
          setLoading(false);
          setInitializing(false);
        }
      }
    };
    
    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      if (!isMounted) return;

      // INITIAL_SESSION: handled exclusively by initAuth above — skip to avoid race
      if (_evt === "INITIAL_SESSION") return;

      if (_evt === "TOKEN_REFRESHED") {
        // Only refresh the session token — do NOT call setUser().
        // The user identity is unchanged; creating a new User object reference
        // would trigger unnecessary re-renders in TenantContext and other consumers.
        if (s) {
          setSession(s);
        } else {
          // Token refresh failed — session is invalid.
          // Clear user + session to avoid inconsistent state where user exists
          // but appRole is null, which causes Protected to make incorrect
          // tenant redirect decisions (flicker root cause).
          setUser(null);
          setSession(null);
          setAppRole(null);
          setUserState(null);
          setLoading(false);
          setInitializing(false);
        }
        return;
      }

      if (_evt === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setAppRole(null);
        setUserState(null);
        setLoading(false);
        setInitializing(false);
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);
      setRedirected(false);

      if (s?.user) {
        if (_evt === "SIGNED_IN") {
          setLoading(true);
          const signInTimeout = setTimeout(() => {
            if (isMounted) setLoading(false);
          }, 15_000);
          try {
            const { data: mems } = await supabase
              .from("memberships")
              .select("tenant_id, role")
              .eq("user_id", s.user.id);

            if (!isMounted) return;

            const roles = (mems ?? []).map((m: any) => m.role);
            const isOwnerOrAdmin = roles.includes("owner") || roles.includes("admin");
            const newRole: AppRole | null = isOwnerOrAdmin
              ? (roles.includes("admin") ? "admin" : "b2b")
              : (s.user.user_metadata?.account_type === "b2b" ? "b2b" : "b2c");

            setAppRole(newRole);
            setUserState({
              isB2B: newRole === "b2b" || newRole === "admin",
              hasCommunity: isOwnerOrAdmin,
              hasJoinedCommunities: mems && mems.length > 0,
            });
          } catch (err) {
            console.error("Error fetching memberships on auth change:", err);
            if (isMounted) setAppRole("b2c");
          } finally {
            clearTimeout(signInTimeout);
            if (isMounted) setLoading(false);
          }
        }
      } else {
        setAppRole(null);
        setUserState(null);
        setLoading(false);
      }
    });

    return () => { isMounted = false; clearTimeout(authTimeout); sub.subscription.unsubscribe(); };
  }, []);

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
        newRole = (user?.user_metadata?.account_type === "b2b" ? "b2b" : "b2c");
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
        user, session, loading, initializing,
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
