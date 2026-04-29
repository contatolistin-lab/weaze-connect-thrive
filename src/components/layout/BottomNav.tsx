import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, User, LayoutGrid, BarChart3, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Bottom navigation dentro de uma comunidade.
 * - B2C: Feed / Conversas / Tópicos / Mensagens / Perfil
 * - B2B: Feed / Conteúdo / Conversas / Tópicos / Mensagens / Métricas / Perfil
 * - Admin: vai para /admin via URL direta
 */
export default function BottomNav() {
  const { pathname } = useLocation();
  const { isB2B } = useAuth();

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    ...(isB2B ? [{ to: "/content", icon: LayoutGrid, label: "Conteúdo" }] : []),
    { to: "/community", icon: MessageSquare, label: "Conversas" },
    { to: "/topics", icon: MessageSquareText, label: "Tópicos" },
    { to: "/messages", icon: MessageCircle, label: "Mensagens" },
    ...(isB2B ? [{ to: "/metrics", icon: BarChart3, label: "Métricas" }] : []),
    { to: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto max-w-xl grid px-1 pt-2 safe-bottom",
          isB2B ? "grid-cols-7" : "grid-cols-5",
        )}
      >
        {items.map(({ to, icon: Icon, label }) => {
          const active =
            pathname === to ||
            (to !== "/feed" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] transition-colors",
                active ? "text-primary-custom" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-[22px] w-[22px]", active && "text-primary-custom")} strokeWidth={active ? 2.4 : 1.8} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
