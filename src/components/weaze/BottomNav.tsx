import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, Users, BarChart3, User } from "lucide-react";

const items: { to: string; icon: typeof Home; label: string }[] = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/conversas", icon: MessageSquare, label: "Conversas" },
  { to: "/groups", icon: Users, label: "Grupos" },
  { to: "/metricas", icon: BarChart3, label: "Métricas" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border safe-pb"
      style={{ boxShadow: "0 -6px 24px -16px rgba(11,11,18,0.12)" }}
    >
      <ul className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = path === to || (to !== "/feed" && path.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to as any}
                className="flex flex-col items-center justify-center gap-1 py-2.5 px-2"
                aria-label={label}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.6 : 2}
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
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
