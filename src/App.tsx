import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Communities from "./pages/Communities";
import Feed from "./pages/Feed";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import Content from "./pages/Content";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminRevenue from "./pages/admin/Revenue";
import AdminFunnel from "./pages/admin/Funnel";
import AdminUsers from "./pages/admin/Users";
import AdminTenants from "./pages/admin/Tenants";
import AdminContent from "./pages/admin/Content";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const NeedsTenant = ({ children }: { children: JSX.Element }) => {
  const { tenant, loading } = useTenant();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  // Se não tem tenant, mostra feed vazio (para B2B criar)
  return children;
};

const OwnerOnly = ({ children }: { children: JSX.Element }) => {
  const { isOwner, loading } = useTenant();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!isOwner) return <Navigate to="/feed" replace />;
  return children;
};

const AdminOnly = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, loading, user } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const B2BOnly = ({ children }: { children: JSX.Element }) => {
  const { isB2B, loading, user, appRole } = useAuth();
  if (loading || (user && !appRole)) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isB2B) return <Navigate to="/feed" replace />;
  return children;
};

const B2COnly = ({ children }: { children: JSX.Element }) => {
  const { isB2C, loading, user, appRole } = useAuth();
  if (loading || (user && !appRole)) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isB2C) return <Navigate to="/feed" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/communities" element={<Protected><B2COnly><Communities /></B2COnly></Protected>} />
              <Route path="/onboarding" element={<Protected><B2BOnly><Onboarding /></B2BOnly></Protected>} />
              <Route path="/feed" element={<Protected><NeedsTenant><Feed /></NeedsTenant></Protected>} />
              <Route path="/community" element={<Protected><NeedsTenant><Community /></NeedsTenant></Protected>} />
              <Route path="/messages" element={<Protected><NeedsTenant><Messages /></NeedsTenant></Protected>} />
              <Route path="/content" element={<Protected><B2BOnly><NeedsTenant><Content /></NeedsTenant></B2BOnly></Protected>} />
              <Route path="/content/services" element={<Protected><B2BOnly><NeedsTenant><AdminContent /></NeedsTenant></B2BOnly></Protected>} />
              <Route path="/content/events" element={<Protected><B2BOnly><NeedsTenant><AdminContent /></NeedsTenant></B2BOnly></Protected>} />
              <Route path="/create" element={<Protected><B2BOnly><NeedsTenant><CreatePost /></NeedsTenant></B2BOnly></Protected>} />
              <Route path="/profile" element={<Protected><NeedsTenant><Profile /></NeedsTenant></Protected>} />
              <Route path="/admin" element={<Protected><AdminOnly><AdminLayout /></AdminOnly></Protected>} />
              <Route path="/metrics" element={<Protected><B2BOnly><NeedsTenant><AdminLayout /></NeedsTenant></B2BOnly></Protected>}>
                <Route index element={<AdminOverview />} />
                <Route path="revenue" element={<AdminRevenue />} />
                <Route path="funnel" element={<AdminFunnel />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="tenants" element={<AdminTenants />} />
                <Route path="content" element={<AdminContent />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
