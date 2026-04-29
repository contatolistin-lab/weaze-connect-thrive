import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import OnboardingTour from "@/components/OnboardingTour";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>
);

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Communities = lazy(() => import("./pages/Communities"));
const Feed = lazy(() => import("./pages/Feed"));
const Community = lazy(() => import("./pages/Community"));
const Messages = lazy(() => import("./pages/Messages"));
const Content = lazy(() => import("./pages/Content"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminRevenue = lazy(() => import("./pages/admin/Revenue"));
const AdminFunnel = lazy(() => import("./pages/admin/Funnel"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminTenants = lazy(() => import("./pages/admin/Tenants"));
const AdminGlobal = lazy(() => import("./pages/admin/AdminGlobal"));
const Profile = lazy(() => import("./pages/Profile"));
const Topics = lazy(() => import("./pages/Topics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Lives = lazy(() => import("./pages/admin/Lives"));

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
                <Route path="/content/lives" element={<Protected><NeedsTenant><Lives /></NeedsTenant></Protected>} />
                <Route path="/admin/*" element={<Protected><NeedsTenant><AdminLayout /></NeedsTenant></Protected>} />
                <Route path="/metrics" element={<Protected><NeedsTenant><AdminOverview /></NeedsTenant></Protected>} />
                <Route path="/metrics/revenue" element={<Protected><NeedsTenant><AdminRevenue /></NeedsTenant></Protected>} />
                <Route path="/metrics/funnel" element={<Protected><NeedsTenant><AdminFunnel /></NeedsTenant></Protected>} />
                <Route path="/metrics/users" element={<Protected><NeedsTenant><AdminUsers /></NeedsTenant></Protected>} />
                <Route path="/metrics/tenants" element={<Protected><NeedsTenant><AdminTenants /></NeedsTenant></Protected>} />
                <Route path="/admin" element={<Protected><AdminGlobal /></Protected>} />
                <Route path="/create" element={<Protected><NeedsTenant><CreatePost /></NeedsTenant></Protected>} />
                <Route path="/topics" element={<Protected><NeedsTenant><Topics /></NeedsTenant></Protected>} />
                <Route path="/notifications" element={<Protected><NeedsTenant><Notifications /></NeedsTenant></Protected>} />
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