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
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants(*)")
      .eq("user_id", user.id);
    const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
    const roles: TenantRoles = {} as TenantRoles;
    (mems ?? []).forEach((m: unknown) => {
      const membership = m as { tenant_id: string; role: "owner" | "admin" | "member" };
      roles[membership.tenant_id] = membership.role;
    });
    setMemRoles(roles);
    setTenants(list);

    let targetTenant: Tenant | null = null;
    let targetRole: "owner" | "admin" | "member" | null = null;

    const pendingSlug = localStorage.getItem("weaze:pending_invite_slug") || sessionStorage.getItem("weaze:pending_invite_slug");
    const pendingTenant = list.find(t => t.slug === pendingSlug);

    if (pendingTenant) {
      targetTenant = pendingTenant;
      targetRole = roles[pendingTenant.id];
      localStorage.removeItem("weaze:pending_invite_slug");
      sessionStorage.removeItem("weaze:pending_invite_slug");
    }

    if (!targetTenant && list.length > 0) {
      const activeTenantId = localStorage.getItem("weaze:active_tenant");
      const activeTenant = list.find(t => t.id === activeTenantId);
      if (activeTenant) {
        targetTenant = activeTenant;
        targetRole = roles[activeTenant.id];
      } else {
        targetTenant = list[0];
        targetRole = roles[list[0].id];
      }
    }

    if (targetTenant && targetRole) {
      setTenant(targetTenant);
      setIsOwner(targetRole === "owner");
      setCanManage(targetRole === "owner" || targetRole === "admin");
      localStorage.setItem("weaze:active_tenant", targetTenant.id);
    } else {
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
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