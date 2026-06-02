import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, Users, BarChart3, User, Plus } from "lucide-react";
import { useCommunity } from "@/lib/community-store";

const sharedItems: { to: string; icon: typeof Home; label: string }[] = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/conversas", icon: MessageSquare, label: "Conversas" },
  { to: "/groups", icon: Users, label: "Grupos" },
];

const b2bItems: { to: string; icon: typeof Home; label: string }[] = [
  { to: "/metricas", icon: BarChart3, label: "Métricas" },
];

export function BottomNav() {
  const { location } = useRouterState();
  const { userType } = useCommunity();
  const path = location.pathname;
  const isB2B = userType.isB2B;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border safe-pb"
      style={{ boxShadow: "0 -6px 24px -16px rgba(11,11,18,0.12)" }}
    >
      <ul className={`mx-auto max-w-md grid ${isB2B ? "grid-cols-6" : "grid-cols-4"}`}>
        {sharedItems.map(({ to, icon: Icon, label }) => {
          const active = path === to || (to !== "/feed" && path.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to as any}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-1"
                aria-label={label}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.6 : 2}
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
                />
                <span
                  className="text-[9px] font-semibold leading-tight"
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}

        {isB2B && (
          <li>
            <Link
              to="/create"
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-1"
              aria-label="Criar"
            >
              <span className="h-10 w-10 rounded-xl bg-brand-gradient text-white grid place-items-center shadow-brand -mt-2">
                <Plus size={22} strokeWidth={3} />
              </span>
              <span
                className="text-[9px] font-semibold leading-tight"
                style={{ color: "#d81e62", opacity: 0.55 }}
              >
                Criar
              </span>
            </Link>
          </li>
        )}

        {isB2B && b2bItems.map(({ to, icon: Icon, label }) => {
          const active = path === to || path.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to as any}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-1"
                aria-label={label}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.6 : 2}
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
                />
                <span
                  className="text-[9px] font-semibold leading-tight"
                  style={{ color: "#d81e62", opacity: active ? 1 : 0.55 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            to={isB2B ? "/profile" : "/b2c/profile"}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-1"
            aria-label="Perfil"
          >
            <User
              size={20}
              strokeWidth={path.startsWith("/profile") || path.startsWith("/b2c/profile") ? 2.6 : 2}
              style={{ color: "#d81e62", opacity: path.startsWith("/profile") || path.startsWith("/b2c/profile") ? 1 : 0.55 }}
            />
            <span
              className="text-[9px] font-semibold leading-tight"
              style={{ color: "#d81e62", opacity: path.startsWith("/profile") || path.startsWith("/b2c/profile") ? 1 : 0.55 }}
            >
              Perfil
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
