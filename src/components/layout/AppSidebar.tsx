import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, User, BarChart3, Bell, Plus, Users, Folder, Building2, Headset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import Logo from "@/components/Logo";

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user, isB2B, isB2C, appRole, initializing, loading: authLoading } = useAuth();
  const { tenant, isOwner, canManage, loading: tenantLoading, realLoadDone } = useTenant();

  // Só decide os itens de nav após auth e tenant estarem resolvidos,
  // impedindo o flash de itens B2C para usuários B2B.
  const authResolved = !initializing && !authLoading && realLoadDone;
  const showAdminItems = authResolved && (isB2B || appRole === "admin" || isOwner || canManage);
  const isB2CByMetadata = user?.user_metadata?.account_type === "b2c";
  const showB2CItems  = authResolved && !showAdminItems && (isB2C || isB2CByMetadata);

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    ...(showAdminItems ? [{ to: "/create", icon: Plus, label: "Criar" }] : []),
    { to: "/conversas", icon: MessageSquare, label: "Conversas" },
    { to: "/notifications", icon: Bell, label: "Notificações" },
    { to: "/messages", icon: MessageCircle, label: "Msgs" },
    ...(showAdminItems ? [{ to: "/metrics", icon: BarChart3, label: "Métricas" }] : []),
    ...(showAdminItems ? [{ to: "/members", icon: Users, label: "Membros" }] : []),
    ...(showAdminItems ? [{ to: "/groups", icon: Folder, label: "Grupos" }] : []),
    ...(showAdminItems ? [{ to: "/atendimento", icon: Headset, label: "Atendimento" }] : []),
    ...(showB2CItems ? [{ to: "/groups/b2c", icon: Folder, label: "Grupos" }] : []),
    ...(showAdminItems && tenant?.slug ? [{ to: `/m/${tenant.slug}`, icon: Building2, label: "Comunidade" }] : []),
    ...(showB2CItems ? [{ to: "/profile", icon: User, label: "Perfil" }] : []),
  ];

  const isActive = (to: string) =>
    pathname === to || (to !== "/feed" && pathname.startsWith(to));

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 z-50 w-[200px] border-r border-border bg-background">
      <div className="flex items-center h-14 px-4 border-b border-border">
        <Link to="/feed" className="flex items-center gap-2">
          <Logo size={72} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary-custom/10 text-primary-custom"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
