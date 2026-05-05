import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { getCommunityAccess } from "@/lib/communityAccess";
import OnboardingTour from "@/components/OnboardingTour";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppEntrance from "@/components/AppEntrance";

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
const Notifications = lazy(() => import("./pages/Notifications"));
const AdminTenants = lazy(() => import("./pages/admin/Tenants"));
const AdminGlobal = lazy(() => import("./pages/admin/AdminGlobal"));
const Profile = lazy(() => import("./pages/Profile"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const Topics = lazy(() => import("./pages/Topics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Lives = lazy(() => import("./pages/admin/Lives"));
const InviteLinks = lazy(() => import("./pages/admin/InviteLinks"));
const Offline = lazy(() => import("./pages/Offline"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));

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

const NeedsAccess = ({ children }: { children: JSX.Element }) => {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user || !tenant) {
      setLoading(false);
      return;
    }

    // B2B sempre tem acesso
    if (isB2B) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // B2C: verificar localStorage
    const status = getCommunityAccess(tenant.slug);
    const approved = status === "approved";
    setHasAccess(approved);
    setLoading(false);
    
    if (!approved) {
      navigate(`/c?slug=${tenant.slug}`, { replace: true });
    }
  }, [user, tenant, isB2B, navigate]);

  if (loading) return <Loading />;
  if (!hasAccess) return null;
  return children;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <AuthProvider>
              <TenantProvider>
                <OnboardingTour />
                <AppEntrance>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/m" element={<CommunityPage />} />
                    <Route path="/c" element={<CommunityPage />} />
                    <Route path="/m/:slug" element={<CommunityPage />} />
                    <Route path="/c/:slug" element={<CommunityPage />} />
                    <Route path="/community/:slug" element={<CommunityPage />} />
                    <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
<Route path="/communities" element={<Protected><Communities /></Protected>} />
                    <Route path="/feed" element={<Protected><NeedsTenant><NeedsAccess><Feed /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/messages" element={<Protected><NeedsTenant><NeedsAccess><Messages /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content" element={<Protected><NeedsTenant><NeedsAccess><Content /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/services" element={<Protected><NeedsTenant><NeedsAccess><AdminContent /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/events" element={<Protected><NeedsTenant><NeedsAccess><AdminContent /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/lives" element={<Protected><NeedsTenant><NeedsAccess><Lives /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/admin/*" element={<Protected><NeedsTenant><AdminLayout /></NeedsTenant></Protected>} />
                    <Route path="/metrics" element={<Protected><NeedsTenant><NeedsAccess><AdminOverview /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/metrics/revenue" element={<Protected><NeedsTenant><AdminRevenue /></NeedsTenant></Protected>} />
                    <Route path="/metrics/funnel" element={<Protected><NeedsTenant><AdminFunnel /></NeedsTenant></Protected>} />
                    <Route path="/metrics/users" element={<Protected><NeedsTenant><AdminUsers /></NeedsTenant></Protected>} />
                    <Route path="/metrics/tenants" element={<Protected><NeedsTenant><AdminTenants /></NeedsTenant></Protected>} />
                    <Route path="/admin" element={<Protected><AdminGlobal /></Protected>} />
                    <Route path="/create" element={<Protected><NeedsTenant><NeedsAccess><CreatePost /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/conversas" element={<Protected><NeedsTenant><NeedsAccess><Topics /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/conversas/:topicId" element={<Protected><NeedsTenant><NeedsAccess><Topics /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/m/:slug" element={<CommunityPage />} />
                    <Route path="/c/:slug" element={<CommunityPage />} />
                    <Route path="/invite/:code" element={<InviteLanding />} />
                    <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
                    <Route path="/profile" element={<Protected><NeedsTenant><Profile /></NeedsTenant></Protected>} />
                    <Route path="/offline" element={<Offline />} />
                    <Route path="*" element={<Navigate to="/feed" replace />} />
                  </Routes>
                </AppEntrance>
              </TenantProvider>
            </AuthProvider>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;