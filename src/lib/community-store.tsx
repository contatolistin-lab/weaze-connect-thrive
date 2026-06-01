import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface CommunityData {
  name: string;
  description: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  whatsapp: string;
  avatar?: string;
}

interface UserTypeContext {
  isB2B: boolean;
  setB2B: (v: boolean) => void;
}

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthContext {
  isAuthenticated: boolean;
  user: AuthUser | null;
  signup: (name: string, email: string, password: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

interface CommunityContextType {
  community: CommunityData;
  updateCommunity: (data: Partial<CommunityData>) => void;
  userType: UserTypeContext;
  auth: AuthContext;
}

const defaultCommunity: CommunityData = {
  name: "Du Brown",
  description: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  whatsapp: "",
};

const CommunityCtx = createContext<CommunityContextType | null>(null);

const AUTH_USERS_KEY = "weaze_auth_users";
const AUTH_SESSION_KEY = "weaze_auth_session";

function getStoredUsers(): Record<string, { name: string; password: string }> {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getStoredSession(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function storeSession(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [community, setCommunity] = useState<CommunityData>(defaultCommunity);
  const [isB2B, setB2BState] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("weaze_community");
      if (saved) setCommunity(JSON.parse(saved));
    } catch { /* silent */ }
    try {
      const saved = localStorage.getItem("weaze_user_b2b");
      if (saved) setB2BState(saved === "true");
    } catch { /* silent */ }
    try {
      const session = getStoredSession();
      if (session) setUser(session);
    } catch { /* silent */ }
  }, []);

  const updateCommunity = useCallback((data: Partial<CommunityData>) => {
    setCommunity((prev) => {
      const next = { ...prev, ...data };
      try {
        localStorage.setItem("weaze_community", JSON.stringify(next));
      } catch {
        /* silent */
      }
      return next;
    });
  }, []);

  const setB2B = useCallback((v: boolean) => {
    setB2BState(v);
    try {
      localStorage.setItem("weaze_user_b2b", String(v));
    } catch {
      /* silent */
    }
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const users = getStoredUsers();
    users[email] = { name, password };
    try {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    } catch { /* silent */ }
    const sessionUser: AuthUser = { name, email };
    storeSession(sessionUser);
    setUser(sessionUser);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const users = getStoredUsers();
    const record = users[email];
    if (!record || record.password !== password) return false;
    const sessionUser: AuthUser = { name: record.name, email };
    storeSession(sessionUser);
    setUser(sessionUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    storeSession(null);
    setUser(null);
  }, []);

  const userType: UserTypeContext = { isB2B, setB2B };
  const auth: AuthContext = {
    isAuthenticated: !!user,
    user,
    signup,
    login,
    logout,
  };

  return (
    <CommunityCtx.Provider value={{ community, updateCommunity, userType, auth }}>
      {children}
    </CommunityCtx.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityCtx);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}

export const communityEmail = "expressiva.vix@gmail.com";
