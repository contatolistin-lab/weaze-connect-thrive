import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  return <Navigate to={user ? "/communities" : "/"} replace />;
}
