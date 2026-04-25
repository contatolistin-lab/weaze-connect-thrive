import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
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

const STORAGE_KEY = "weaze:active_tenant";
const DEFAULT_BRAND_FROM = "282 100% 28%"; // #630091
const DEFAULT_BRAND_TO = "336 75% 48%";    // #d81e62

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memRoles, setMemRoles] = useState<Record<string, "owner" | "member">>({});

  const load = useCallback(async () => {
    setLoading(true);
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { data } = await supabase.from("tenants").select("*").eq("id", stored).maybeSingle();
        setTenant((data as Tenant) ?? null);
      } else {
        setTenant(null);
      }
      setTenants([]);
      setIsOwner(false);
      setLoading(false);
      return;
    }
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants(*)")
      .eq("user_id", user.id);
    const list = (mems ?? []).map((m: any) => m.tenants).filter(Boolean) as Tenant[];
    const roles: Record<string, "owner" | "member"> = {};
    (mems ?? []).forEach((m: any) => { roles[m.tenant_id] = m.role; });
    setMemRoles(roles);
    setTenants(list);
    const stored = localStorage.getItem(STORAGE_KEY);
    const active = list.find((t) => t.id === stored) ?? list[0] ?? null;
    setTenant(active);
    setIsOwner(active ? roles[active.id] === "owner" : false);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Aplica cores do tenant (white-label runtime)
  useEffect(() => {
    const root = document.documentElement;
    if (!tenant) {
      root.style.setProperty("--brand-from", DEFAULT_BRAND_FROM);
      root.style.setProperty("--brand-to", DEFAULT_BRAND_TO);
      return;
    }
    if (tenant.primary_color) {
      root.style.setProperty("--brand-to", hexToHsl(tenant.primary_color));
      root.style.setProperty("--primary", hexToHsl(tenant.primary_color));
    }
    if (tenant.secondary_color) {
      root.style.setProperty("--brand-from", hexToHsl(tenant.secondary_color));
    } else {
      root.style.setProperty("--brand-from", DEFAULT_BRAND_FROM);
    }
  }, [tenant]);

  const selectTenant = (id: string) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    setTenant(t);
    setIsOwner(memRoles[id] === "owner");
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <Ctx.Provider value={{ tenant, tenants, isOwner, loading, selectTenant, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return DEFAULT_BRAND_TO;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
