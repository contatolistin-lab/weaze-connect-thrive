import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, DollarSign, Filter, Users, Building2, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", icon: BarChart3, label: "Visão geral", end: true },
  { to: "/admin/revenue", icon: DollarSign, label: "Receita" },
  { to: "/admin/funnel", icon: Filter, label: "Funil de CTAs" },
  { to: "/admin/users", icon: Users, label: "Usuários" },
  { to: "/admin/tenants", icon: Building2, label: "Tenants" },
  { to: "/admin/content", icon: FileText, label: "Conteúdo" },
];

export default function AdminLayout() {
  const { tenant } = useTenant();
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden md:flex w-60 bg-background border-r border-border flex-col p-4">
        <Link to="/feed" className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-4 w-4" />
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
