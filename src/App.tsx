import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import OnboardingTour from "@/components/OnboardingTour";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Communities from "./pages/Communities";
import Feed from "./pages/Feed";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import Content from "./pages/Content";
import CreatePost from "./pages/CreatePost";
import AdminContent from "./pages/admin/Content";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import AdminRevenue from "./pages/admin/Revenue";
import AdminFunnel from "./pages/admin/Funnel";
import AdminUsers from "./pages/admin/Users";
import AdminTenants from "./pages/admin/Tenants";
import AdminGlobal from "./pages/admin/AdminGlobal";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>
);

const Protected = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const NeedsTenant = ({ children }: { children: JSX.Element }) => {
  const { loading } = useTenant();
  if (loading) return <Loading />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <AuthProvider>
            <TenantProvider>
              <OnboardingTour />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
                <Route path="/communities" element={<Protected><Communities /></Protected>} />
                <Route path="/feed" element={<Protected><NeedsTenant><Feed /></NeedsTenant></Protected>} />
                <Route path="/community" element={<Protected><NeedsTenant><Community /></NeedsTenant></Protected>} />
                <Route path="/messages" element={<Protected><NeedsTenant><Messages /></NeedsTenant></Protected>} />
                <Route path="/content" element={<Protected><NeedsTenant><Content /></NeedsTenant></Protected>} />
                <Route path="/content/services" element={<Protected><NeedsTenant><AdminContent /></NeedsTenant></Protected>} />
                <Route path="/content/events" element={<Protected><NeedsTenant><AdminContent /></NeedsTenant></Protected>} />
                <Route path="/admin/*" element={<Protected><NeedsTenant><AdminLayout /></NeedsTenant></Protected>} />
                <Route path="/metrics" element={<Protected><NeedsTenant><AdminOverview /></NeedsTenant></Protected>} />
                <Route path="/metrics/revenue" element={<Protected><NeedsTenant><AdminRevenue /></NeedsTenant></Protected>} />
                <Route path="/metrics/funnel" element={<Protected><NeedsTenant><AdminFunnel /></NeedsTenant></Protected>} />
                <Route path="/metrics/users" element={<Protected><NeedsTenant><AdminUsers /></NeedsTenant></Protected>} />
                <Route path="/metrics/tenants" element={<Protected><NeedsTenant><AdminTenants /></NeedsTenant></Protected>} />
                <Route path="/admin" element={<Protected><AdminGlobal /></Protected>} />
                <Route path="/create" element={<Protected><NeedsTenant><CreatePost /></NeedsTenant></Protected>} />
                <Route path="/profile" element={<Protected><NeedsTenant><Profile /></NeedsTenant></Protected>} />
              </Routes>
            </TenantProvider>
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;