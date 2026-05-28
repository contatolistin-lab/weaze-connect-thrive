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
  blocked: boolean;
  loading: boolean;
  realLoadDone: boolean;
  selectTenant: (id: string) => void;
  refresh: (overrideUserId?: string) => Promise<void>;
};

const Ctx = createContext<TenantCtx>({
  tenant: null, tenants: [], isOwner: false, canManage: false, blocked: false, loading: true, realLoadDone: false,
  selectTenant: () => {}, refresh: async (_uid?: string) => {}, realLoadDone: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManage, setCanManage] = useState(false);
const [loading, setLoading] = useState(true);
  const [memRoles, setMemRoles] = useState<TenantRoles>({} as TenantRoles);
  const [blocked, setBlocked] = useState(false);
  const [memActive, setMemActive] = useState<Record<string, boolean>>({});
  const [manualSelectionPending, setManualSelectionPending] = useState(false);
  const [manualSelectedTenantId, setManualSelectedTenantId] = useState<string | null>(null);
  const [realLoadDone, setRealLoadDone] = useState(false);
  const lastLoadedUserId = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (overrideUserId?: string): Promise<void> => {
    const uid = overrideUserId ?? user?.id ?? null;
    if (uid === lastLoadedUserId.current) {
      if (uid === null) {
        loadingRef.current = false;
        setLoading(false);
        setRealLoadDone(true);
      }
      return;
    }
    lastLoadedUserId.current = uid;
    if (!uid) {
      loadingRef.current = false;
      setLoading(false);
      setRealLoadDone(true);
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    setRealLoadDone(false);

    const safetyTimeout = setTimeout(() => {
      if (loadingRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }, 20_000);

    try {
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id, role, is_active, tenants(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
    const roles: TenantRoles = {} as TenantRoles;
    const activeMap: Record<string, boolean> = {};
    (mems ?? []).forEach((m: unknown) => {
      const membership = m as { tenant_id: string; role: "owner" | "admin" | "member"; is_active: boolean };
      roles[membership.tenant_id] = membership.role;
      activeMap[membership.tenant_id] = membership.is_active;
    });
    setMemRoles(roles);
    setMemActive(activeMap);
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
      const lastActiveTenantId = localStorage.getItem("weaze:last_active_tenant");
      const lastActiveTenant = lastActiveTenantId ? list.find(t => t.id === lastActiveTenantId && roles[t.id]) : null;
      const activeTenant = activeTenantId ? list.find(t => t.id === activeTenantId && roles[t.id]) : null;
      
      if (lastActiveTenant) {
        targetTenant = lastActiveTenant;
        targetRole = roles[lastActiveTenant.id];
      } else if (activeTenant) {
        targetTenant = activeTenant;
        targetRole = roles[activeTenant.id];
      } else {
        const ownedTenants = list.filter(t => roles[t.id] === "owner" || roles[t.id] === "admin");
        if (ownedTenants.length > 0) {
          targetTenant = ownedTenants[0];
          targetRole = roles[targetTenant.id];
        } else {
          targetTenant = list[0];
          targetRole = roles[list[0].id];
        }
      }
      if (targetTenant) {
        localStorage.setItem("weaze:active_tenant", targetTenant.id);
        localStorage.setItem("weaze:last_active_tenant", targetTenant.id);
      }
    }

    if (targetTenant && !roles[targetTenant.id]) {
      if (list.length > 0) {
        const ownedTenants = list.filter(t => roles[t.id] === "owner" || roles[t.id] === "admin");
        if (ownedTenants.length > 0) {
          targetTenant = ownedTenants[0];
          targetRole = roles[targetTenant.id];
        } else {
          targetTenant = list[0];
          targetRole = roles[list[0].id];
        }
        localStorage.setItem("weaze:active_tenant", targetTenant.id);
        localStorage.setItem("weaze:last_active_tenant", targetTenant.id);
      } else {
        targetTenant = null;
        targetRole = null;
        localStorage.removeItem("weaze:active_tenant");
        localStorage.removeItem("weaze:last_active_tenant");
      }
    }

    const justJoinedId = sessionStorage.getItem("just_joined_community");
    if (justJoinedId) {
      sessionStorage.removeItem("just_joined_community");
      const justJoinedTenant = list.find(t => t.id === justJoinedId);
      if (justJoinedTenant) {
        targetTenant = justJoinedTenant;
        targetRole = roles[justJoinedTenant.id];
      }
    }

    if (manualSelectionPending && manualSelectedTenantId) {
      const manualTenant = list.find(t => t.id === manualSelectedTenantId);
      if (manualTenant) {
        targetTenant = manualTenant;
        targetRole = roles[manualSelectedTenantId];
      }
      setManualSelectionPending(false);
      setManualSelectedTenantId(null);
    }

    const isAdminOrOwner = targetRole === "owner" || targetRole === "admin";
    const membershipActive = targetTenant ? activeMap[targetTenant.id] : undefined;
    setBlocked(!!targetTenant && !isAdminOrOwner && membershipActive === false);

if (targetTenant && targetRole) {
      setTenant(targetTenant);
      setIsOwner(targetRole === "owner");
      setCanManage(targetRole === "owner" || targetRole === "admin");
      localStorage.setItem("weaze:active_tenant", targetTenant.id);
    } else {
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
      setBlocked(false);
    }
      setRealLoadDone(true);
    } catch (err) {
      console.error("[TenantContext] Error loading tenants:", err);
    } finally {
      clearTimeout(safetyTimeout);
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async (overrideUserId?: string) => {
    lastLoadedUserId.current = null;
    return load(overrideUserId);
  }, [load]);

  const selectTenant = useCallback((id: string, isManual: boolean = false) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    const role = memRoles[id];
    const isAdminOrOwner = role === "owner" || role === "admin";
    setTenant(t);
    setIsOwner(role === "owner");
    setCanManage(isAdminOrOwner);
    setBlocked(!isAdminOrOwner && memActive[id] === false);
    localStorage.setItem("weaze:active_tenant", id);
    localStorage.setItem("weaze:last_active_tenant", id);
    if (isManual) {
      setManualSelectionPending(true);
      setManualSelectedTenantId(id);
    }
  }, [tenants, memRoles, memActive]);

  return (
      <Ctx.Provider value={{ tenant, tenants, isOwner, canManage, blocked, loading, realLoadDone, selectTenant, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);