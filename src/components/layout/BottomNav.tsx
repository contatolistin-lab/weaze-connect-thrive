import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, User, LayoutGrid, BarChart3, Bell, Plus, Users, Folder, Building2, Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isB2B, isB2C, user, appRole, initializing, loading: authLoading } = useAuth();
  const { tenant, isOwner, canManage, loading: tenantLoading, realLoadDone } = useTenant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  // Só decide os itens de nav após auth e tenant estarem resolvidos,
  // impedindo o flash de itens B2C para usuários B2B.
  const authResolved = !initializing && !authLoading && realLoadDone;
  const showAdminItems = authResolved && (isB2B || appRole === "admin" || isOwner || canManage);
  const isB2CByMetadata = user?.user_metadata?.account_type === "b2c";
  const showB2CItems  = authResolved && !showAdminItems && (isB2C || isB2CByMetadata);

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    ...(showAdminItems ? [{ to: "/create", icon: Plus, label: "Criar", special: true }] : []),
    { to: "/conversas", icon: MessageSquare, label: "Conversas" },
    { to: "/notifications", icon: Bell, label: "Notificações", badge: pendingCount },
    { to: "/messages", icon: MessageCircle, label: "Msgs" },
    ...(showAdminItems ? [{ to: "/metrics", icon: BarChart3, label: "Métricas" }] : []),
    ...(showAdminItems ? [{ to: "/members", icon: Users, label: "Membros" }] : []),
    ...(showAdminItems ? [{ to: "/groups", icon: Folder, label: "Grupos" }] : []),
    ...(showAdminItems ? [{ to: "/atendimento", icon: Headset, label: "Atendimento" }] : []),
    ...(showB2CItems ? [{ to: "/groups/b2c", icon: Folder, label: "Grupos" }] : []),
    ...(showAdminItems && tenant?.slug ? [{ to: `/m/${tenant.slug}`, icon: Building2, label: "Comunidade" }] : []),
    ...(showB2CItems ? [{ to: "/profile", icon: User, label: "Perfil" }] : []),
  ];

  useEffect(() => {
    if (!isB2B || !user) return;
    
    const loadPendingCount = async () => {
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"]);
      
      if (!mems || mems.length === 0) return;
      
      const { count } = await supabase
        .from("community_requests")
        .select("*", { count: "exact", head: true })
        .in("tenant_id", mems.map(m => m.tenant_id))
        .eq("status", "pending");
      
      setPendingCount(count || 0);
    };
    
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isB2B, user]);

  useEffect(() => {
    if (activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      const container = scrollRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setIndicatorStyle({
          left: rect.left - containerRect.left + container.scrollLeft + 4,
          width: rect.width - 8,
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const active = activeRef.current;
      const container = scrollRef.current;
      const containerWidth = container.offsetWidth;
      const activeLeft = active.offsetLeft;
      const activeWidth = active.offsetWidth;

      if (activeLeft < container.scrollLeft || activeLeft + activeWidth > container.scrollLeft + containerWidth) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [pathname]);

  const isActive = (to: string) => 
    pathname === to || (to !== "/feed" && pathname.startsWith(to));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
      <div
        className={cn(
          "relative mx-auto max-w-xl",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-5 before:bg-gradient-to-r before:from-background before:to-transparent before:z-10 before:pointer-events-none",
          "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-5 after:bg-gradient-to-l after:from-background after:to-transparent after:z-10 after:pointer-events-none",
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "flex items-center gap-0.5 px-1 py-2 overflow-x-auto",
            "scroll-smooth snap-x snap-mandatory",
            "[-webkit-overflow-scrolling:touch]",
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map(({ to, icon: Icon, label, special, badge }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                ref={active ? activeRef : null}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-shrink-0",
                  special ? "px-3" : "min-w-[56px] max-w-[72px] px-1.5",
                  "py-1.5 rounded-lg transition-all snap-center",
                  active
                    ? "text-primary-custom"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <div 
                    className="absolute inset-0 bg-primary-custom/10 rounded-lg -z-10" 
                    style={{
                      position: 'absolute',
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                    }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      special && "h-6 w-6",
                      active && "text-primary-custom"
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "font-medium truncate w-full text-center text-[10px]",
                  special && "text-xs"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}