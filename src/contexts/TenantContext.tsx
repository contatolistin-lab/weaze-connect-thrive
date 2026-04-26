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

type TenantCtx = {
  tenant: Tenant | null;
  tenants: Tenant[];
  isOwner: boolean;
  loading: boolean;
  selectTenant: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<TenantCtx>({
  tenant: null, tenants: [], isOwner: false, loading: true,
  selectTenant: () => {}, refresh: async () => {},
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memRoles, setMemRoles] = useState<Record<string, "owner" | "member">({});

  const load = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setLoading(false);
      return;
    }
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants(*)")
      .eq("user_id", user.id);
    const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
    const roles: Record<string, "owner" | "member"> = {};
    (mems ?? []).forEach((m: unknown) => {
      const membership = m as { tenant_id: string; role: "owner" | "member" };
      roles[membership.tenant_id] = membership.role;
    });
    setMemRoles(roles);
    setTenants(list);
    
    // Auto-selecionar tenant
    const savedId = localStorage.getItem("wenity:active_tenant");
    if (savedId && list.find(t => t.id === savedId)) {
      setTenant(list.find(t => t.id === savedId)!);
      setIsOwner(roles[savedId] === "owner");
    } else if (list.length > 0) {
      setTenant(list[0]);
      setIsOwner(roles[list[0].id] === "owner");
      localStorage.setItem("wenity:active_tenant", list[0].id);
    } else {
      setTenant(null);
      setIsOwner(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selectTenant = (id: string) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    setTenant(t);
    setIsOwner(memRoles[id] === "owner");
    localStorage.setItem("wenity:active_tenant", id);
  };

  return (
    <Ctx.Provider value={{ tenant, tenants, isOwner, loading, selectTenant, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);