import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, Users, BarChart3, User, Plus } from "lucide-react";
import { useCommunity } from "@/lib/community-store";

export function BottomNav() {
  const { location } = useRouterState();
  const { userType, hydrated } = useCommunity();
  const path = location.pathname;
  const isB2B = hydrated && userType.isB2B;
  const perfilTo = isB2B ? "/profile" : "/b2c/profile";

  const navItems: { to: string; icon: typeof Home; label: string }[] = isB2B
    ? [
        { to: "/feed", icon: Home, label: "Feed" },
        { to: "/create", icon: Plus, label: "Criar" },
        { to: "/conversas", icon: MessageSquare, label: "Conversas" },
        { to: "/groups", icon: Users, label: "Grupos" },
        { to: "/metricas", icon: BarChart3, label: "Métricas" },
        { to: perfilTo, icon: User, label: "Perfil" },
      ]
    : [
        { to: "/feed", icon: Home, label: "Feed" },
        { to: "/conversas", icon: MessageSquare, label: "Conversas" },
        { to: "/groups", icon: Users, label: "Grupos" },
        { to: perfilTo, icon: User, label: "Perfil" },
      ];

  const isActive = (to: string) => {
    if (path === to) return true;
    if (to !== "/feed" && path.startsWith(to)) return true;
    if (to === "/profile" && path.startsWith("/b2c/profile")) return true;
    if (to === "/b2c/profile" && path.startsWith("/profile")) return true;
    return false;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border safe-pb"
      style={{ boxShadow: "0 -6px 24px -16px rgba(11,11,18,0.12)" }}
    >
      <ul className={`mx-auto max-w-md grid ${isB2B ? "grid-cols-6" : "grid-cols-4"}`}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          const isCreate = to === "/create";
          return (
            <li key={to}>
              <Link
                to={to as any}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-1"
                aria-label={label}
              >
                {isCreate ? (
                  <span className="h-10 w-10 rounded-xl bg-brand-gradient text-white grid place-items-center shadow-brand -mt-2">
                    <Plus size={22} strokeWidth={3} />
                  </span>
                ) : (
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.6 : 2}
                    style={{ color: "#000000", opacity: active ? 1 : 0.55 }}
                  />
                )}
                <span
                  className="text-[9px] font-semibold leading-tight"
                  style={{ color: "#000000", opacity: active || isCreate ? 1 : 0.55 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
