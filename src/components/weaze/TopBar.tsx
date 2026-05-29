import { Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { WeazeLogo } from "./WeazeLogo";
import { useWeaze } from "@/lib/weaze-context";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showLogo?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, showSearch = true, showLogo = true, right }: TopBarProps) {
  const { unreadCount } = useWeaze();
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border safe-pt">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          {showLogo && <WeazeLogo size="sm" />}
          {title && <h1 className="ml-1 font-bold text-base truncate text-foreground">{title}</h1>}
        </div>
        <div className="flex items-center gap-1">
          {showSearch && (
            <Link
              to="/conversas"
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
            >
              <Search size={20} className="text-foreground/80" />
            </Link>
          )}
          <Link
            to="/notifications"
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted relative"
          >
            <Bell size={20} className="text-foreground/80" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-brand-gradient text-[10px] font-bold text-white grid place-items-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
