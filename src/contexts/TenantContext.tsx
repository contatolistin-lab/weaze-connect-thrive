import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
};

type TenantRoles = Record<string, "owner" | "admin" | "member">;

type TenantCtx = {
  tenant: Tenant | null;
  tenants: Tenant[];
  isOwner: boolean;
  canManage: boolean;
  loading: boolean;
  selectTenant: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<TenantCtx>({
  tenant: null, tenants: [], isOwner: false, canManage: false, loading: true,
  selectTenant: () => {}, refresh: async () => {},
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memRoles, setMemRoles] = useState<TenantRoles>({} as TenantRoles);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    if (!user) {
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
      setLoading(false);
      loadingRef.current = false;
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: mems, error } = await supabase
        .from("memberships")
        .select("tenant_id, role, tenants(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
      const roles: TenantRoles = {} as TenantRoles;
      (mems ?? []).forEach((m: unknown) => {
        const membership = m as { tenant_id: string; role: "owner" | "admin" | "member" };
        roles[membership.tenant_id] = membership.role;
      });
      
      setMemRoles(roles);
      setTenants(list);
      
      const justJoinedId = sessionStorage.getItem("just_joined_community");
      const savedId = localStorage.getItem("weaze:active_tenant");
      let targetId: string | null = justJoinedId || savedId || (list[0]?.id ?? null);
      
      if (!list.find(t => t.id === targetId)) {
        targetId = list[0]?.id ?? null;
      }
      
      if (targetId && roles[targetId]) {
        const targetRole = roles[targetId];
        setTenant(list.find(t => t.id === targetId)!);
        setIsOwner(targetRole === "owner");
        setCanManage(targetRole === "owner" || targetRole === "admin");
        if (justJoinedId) {
          sessionStorage.removeItem("just_joined_community");
          localStorage.setItem("weaze:active_tenant", targetId);
        }
      } else {
        setTenant(null);
        setIsOwner(false);
        setCanManage(false);
      }
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selectTenant = (id: string) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    const role = memRoles[id];
    setTenant(t);
    setIsOwner(role === "owner");
    setCanManage(role === "owner" || role === "admin");
    localStorage.setItem("weaze:active_tenant", id);
  };

  return (
    <Ctx.Provider value={{ tenant, tenants, isOwner, canManage, loading, selectTenant, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);