import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, Users, Plus, BarChart3, User } from "lucide-react";
import { WeazeLogo } from "./WeazeLogo";
import { useCommunity } from "@/lib/community-store";

type Item = { to: string; icon: typeof Home; label: string };

const baseItems: Item[] = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/conversas", icon: MessageSquare, label: "Conversas" },
  { to: "/groups", icon: Users, label: "Grupos" },
  { to: "/create", icon: Plus, label: "Criar" },
  { to: "/metricas", icon: BarChart3, label: "Métricas" },
];

const HIDDEN_PATHS = ["/", "/login", "/signup", "/b2b/login", "/b2b/signup"];

export function shouldShowDesktopShell(path: string) {
  if (HIDDEN_PATHS.includes(path)) return false;
  if (path.startsWith("/groups/invite/")) return false;
  if (path.startsWith("/c/")) return false;
  return true;
}

export function DesktopSidebar() {
  const { location } = useRouterState();
  const { userType, hydrated } = useCommunity();
  const path = location.pathname;

  if (!shouldShowDesktopShell(path)) return null;

  const isB2B = hydrated && userType.isB2B;
  const profileTo = isB2B ? "/profile" : "/b2c/profile";
  const items: Item[] = [
    ...baseItems.filter((it) => {
      if (isB2B) return true;
      return it.to !== "/create" && it.to !== "/metricas";
    }),
    { to: profileTo, icon: User, label: "Perfil" },
  ];

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-[#8800aa] w-20 lg:w-60 px-3 lg:px-4 py-5 gap-2"
    >
      <div className="flex items-center justify-center lg:justify-start px-1 lg:px-2 mb-4">
        <WeazeLogo size="sm" variant="white" />
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ to, icon: Icon, label }) => {
          const active =
            path === to ||
            (to !== "/feed" && to !== "/" && path.startsWith(to)) ||
            (to === profileTo && (path.startsWith("/profile") || path.startsWith("/b2c/profile")));
          const isCreate = to === "/create";
          return (
            <Link
              key={to}
              to={to as any}
              aria-label={label}
              className={`group flex items-center gap-3 rounded-xl px-2.5 lg:px-3 py-2.5 transition-colors ${
                active ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              <span
                className={`h-10 w-10 grid place-items-center rounded-xl shrink-0 ${
                  isCreate ? "bg-white text-[#8800aa]" : ""
                }`}
                style={!isCreate ? { color: "white", opacity: active ? 1 : 0.55 } : undefined}
              >
                <Icon size={isCreate ? 22 : 22} strokeWidth={active ? 2.6 : 2} />
              </span>
              <span
                className="hidden lg:inline text-sm font-semibold"
                style={{ color: "white", opacity: active || isCreate ? 1 : 0.55 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
