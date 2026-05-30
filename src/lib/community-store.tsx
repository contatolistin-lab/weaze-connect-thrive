import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface CommunityData {
  name: string;
  description: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  whatsapp: string;
}

interface UserTypeContext {
  isB2B: boolean;
  setB2B: (v: boolean) => void;
}

interface CommunityContextType {
  community: CommunityData;
  updateCommunity: (data: Partial<CommunityData>) => void;
  userType: UserTypeContext;
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

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [community, setCommunity] = useState<CommunityData>(() => {
    try {
      const saved = localStorage.getItem("weaze_community");
      return saved ? JSON.parse(saved) : defaultCommunity;
    } catch {
      return defaultCommunity;
    }
  });

  const [isB2B, setB2BState] = useState(false);

  const updateCommunity = useCallback((data: Partial<CommunityData>) => {
    setCommunity((prev) => {
      const next = { ...prev, ...data };
      localStorage.setItem("weaze_community", JSON.stringify(next));
      return next;
    });
  }, []);

  const setB2B = useCallback((v: boolean) => {
    setB2BState(v);
    localStorage.setItem("weaze_user_b2b", String(v));
  }, []);

  const userType: UserTypeContext = { isB2B, setB2B };

  return (
    <CommunityCtx.Provider value={{ community, updateCommunity, userType }}>
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
