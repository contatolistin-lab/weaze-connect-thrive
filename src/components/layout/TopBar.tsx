import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function TopBar() {
  const { tenant } = useTenant();
  const { isB2C } = useAuth();
  // B2B não navega para /communities — só B2C
  const backHref = isB2C ? "/communities" : "/profile";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-xl flex items-center justify-between px-3 h-14">
        <Link to={backHref} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          {tenant?.logo_url ? (
            <>
              <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-7 rounded-lg object-cover" />
              <span className="font-display text-lg leading-none">{tenant.name}</span>
            </>
          ) : (
            <Logo size={28} />
          )}
        </div>
        <div className="w-9" />
      </div>
    </header>
  );
}
