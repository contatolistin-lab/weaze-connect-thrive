import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, DollarSign, Filter, Users, Building2, FileText, LogOut, Link2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminConversations = lazy(() => import("./Conversations"));

const items = [
  { to: "/metrics", icon: BarChart3, label: "Visão geral", end: true },
  { to: "/metrics/revenue", icon: DollarSign, label: "Receita" },
  { to: "/metrics/funnel", icon: Filter, label: "Funil de CTAs" },
  { to: "/metrics/users", icon: Users, label: "Usuários" },
  { to: "/metrics/conversations", icon: MessageSquare, label: "Conversas" },
  { to: "/metrics/tenants", icon: Building2, label: "Tenants" },
  { to: "/metrics/content", icon: FileText, label: "Conteúdo" },
  { to: "/metrics/invites", icon: Link2, label: "Convites" },
];

export default function AdminLayout() {
  const { tenant } = useTenant();
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden md:flex w-60 bg-background border-r border-border flex-col p-4">
        <Link to="/feed" className="flex items-center gap-2 mb-8">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-brand grid place-items-center text-primary-foreground font-bold">
              {tenant?.name?.[0]?.toUpperCase() ?? "B"}
            </div>
          )}
          <span className="font-display text-xl">{tenant?.name}</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="justify-start">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* mobile top bar */}
        <header className="md:hidden border-b border-border bg-background px-4 h-14 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Link to="/feed" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Link>
          {items.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => cn("shrink-0 text-xs px-3 py-1.5 rounded-full",
                isActive ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>
              {label}
            </NavLink>
          ))}
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
