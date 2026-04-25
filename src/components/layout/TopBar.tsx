import { useTenant } from "@/contexts/TenantContext";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TopBar() {
  const { tenant } = useTenant();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-xl flex items-center justify-between px-3 h-14">
        <Link to="/communities" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-7 rounded-lg object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-lg bg-brand grid place-items-center text-primary-foreground text-xs font-bold">
              {tenant?.name?.[0]?.toUpperCase() ?? "W"}
            </div>
          )}
          <span className="font-display text-lg leading-none">{tenant?.name ?? "Weaze"}</span>
        </div>
        <div className="w-9" />
      </div>
    </header>
  );
}
