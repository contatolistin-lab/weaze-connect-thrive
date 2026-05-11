import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { isPWA, hasVisitedBefore, markAsVisited } from "@/utils/isPWA";

interface AppEntranceProps {
  children: React.ReactNode;
}

export default function AppEntrance({ children }: AppEntranceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (authLoading || tenantLoading) return;

    const visited = hasVisitedBefore();
    const isStandalone = isPWA();

    const isAuthPage = location.pathname === "/auth";
    const isLanding = location.pathname === "/";
    const isWaiting = location.pathname === "/waiting";

    if (!visited && isStandalone && !isAuthPage && !isWaiting) {
      markAsVisited();
      
      if (user && tenant) {
        navigate("/feed", { replace: true });
      } else if (user && !tenant && isLanding) {
        navigate("/auth", { replace: true });
      }
    } else if (!visited) {
      markAsVisited();
    }
    
    setProcessed(true);
  }, [authLoading, tenantLoading, user, tenant, location.pathname]);

  if (authLoading || tenantLoading) {
    return null;
  }

  return <>{children}</>;
}