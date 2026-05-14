import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

  const load = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
      setLoading(false);
      return;
    }
    
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    try {
      console.log("TenantContext: carregando para user_id:", user.id);
      
      const { data: mems, error } = await supabase
        .from("memberships")
        .select("tenant_id, role, tenants(*)")
        .eq("user_id", user.id);
      
      console.log("TenantContext: memberships retornadas:", mems?.length, "erro:", error);
      
      clearTimeout(timeout);
      
      if (error) {
        console.error("Erro ao carregar memberships:", error);
        setLoading(false);
        return;
      }
      
      if (!mems || mems.length === 0) {
        console.log("TenantContext: nenhuma membership encontrada");
        setTenants([]);
        setTenant(null);
        setLoading(false);
        return;
      }
      
      const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
      console.log("TenantContext: tenants encontrados:", list.length);
      
      const roles: TenantRoles = {} as TenantRoles;
      (mems ?? []).forEach((m: unknown) => {
        const membership = m as { tenant_id: string; role: "owner" | "admin" | "member" };
        roles[membership.tenant_id] = membership.role;
      });
      
      setMemRoles(roles);
      setTenants(list);
      
      // Force primeiro tenant se existir - priority máxima
      if (list.length > 0) {
        const firstTenant = list[0];
        const firstRole = roles[firstTenant.id];
        setTenant(firstTenant);
        setIsOwner(firstRole === "owner");
        setCanManage(firstRole === "owner" || firstRole === "admin");
        localStorage.setItem("weaze:active_tenant", firstTenant.id);
        console.log("TenantContext: forçando tenant:", firstTenant.id, "role:", firstRole);
      } else {
        setTenant(null);
        setIsOwner(false);
        setCanManage(false);
        console.log("TenantContext: SEM TENANTS disponíveis");
      }
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
      clearTimeout(timeout);
    }
    
    setLoading(false);
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