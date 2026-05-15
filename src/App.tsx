import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import OnboardingTour from "@/components/OnboardingTour";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppEntrance from "@/components/AppEntrance";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowBanner(true);
    window.addEventListener('sw-update-ready', handleUpdate);
    return () => window.removeEventListener('sw-update-ready', handleUpdate);
  }, []);

  useEffect(() => {
    if (showBanner) {
      window.location.reload();
    }
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-purple-700 text-white text-sm text-center py-2 px-4 cursor-pointer" onClick={() => window.location.reload()}>
      Nova versão disponível — clique para atualizar
    </div>
  );
};

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-t-brand border-brand/20 rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
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

const Requests = lazy(() => import("./pages/Requests"));
const Members = lazy(() => import("./pages/Members"));
const Groups = lazy(() => import("./pages/Groups"));
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
const WaitingApproval = lazy(() => import("./pages/WaitingApproval"));

const Protected = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();
  const [redirectHandled, setRedirectHandled] = useState(false);
  
  // Handle redirect from auth context - this takes priority
  useEffect(() => {
    // This effect is specifically for handling redirects from AuthContext
    // It runs when the app first mounts and auth state is resolved
    if (redirectHandled) return;
    
    // Let the AuthContext handle redirects - we just show loading
    if (loading || tenantLoading) return;
    
    setRedirectHandled(true);
  }, [loading, tenantLoading, redirectHandled]);
  
  // Wait for both auth and tenant to load before checking
  if (loading || tenantLoading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const B2BOnly = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const { isOwner, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading || tenantLoading) return;
    if (!user) return;
    if (!isOwner) {
      navigate("/feed", { replace: true });
    }
  }, [loading, tenantLoading, isOwner, user, navigate]);
  
  if (loading || tenantLoading) return <Loading />;
  if (!isOwner) return null;
  return children;
};

const NeedsTenant = ({ children }: { children: JSX.Element }) => {
  const { loading } = useTenant();
  if (loading) return <Loading />;
  return children;
};

const NeedsAccess = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const { tenant, tenants, loading: tenantLoading } = useTenant();
  
  if (loading || tenantLoading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  
  return children;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UpdateBanner />
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
<Route path="/communities" element={<Protected><B2BOnly><Communities /></B2BOnly></Protected>} />
                    <Route path="/feed" element={<Protected><NeedsTenant><NeedsAccess><Feed /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/messages" element={<Protected><NeedsTenant><NeedsAccess><Messages /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content" element={<Protected><NeedsTenant><NeedsAccess><Content /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/agenda" element={<Protected><NeedsTenant><NeedsAccess><AdminContent /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/services" element={<Protected><NeedsTenant><NeedsAccess><AdminContent /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/events" element={<Protected><NeedsTenant><NeedsAccess><AdminContent /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/content/lives" element={<Protected><NeedsTenant><NeedsAccess><Lives /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/admin/*" element={<Protected><NeedsTenant><AdminLayout /></NeedsTenant></Protected>} />
                    <Route path="/metrics" element={<Protected><NeedsTenant><NeedsAccess><AdminOverview /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/metrics/revenue" element={<Protected><NeedsTenant><NeedsAccess><AdminRevenue /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/metrics/funnel" element={<Protected><NeedsTenant><AdminFunnel /></NeedsTenant></Protected>} />
                    <Route path="/metrics/users" element={<Protected><NeedsTenant><NeedsAccess><AdminUsers /></NeedsAccess></NeedsTenant></Protected>} />
                    
                    <Route path="/metrics/tenants" element={<Protected><NeedsTenant><NeedsAccess><AdminTenants /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/admin" element={<Protected><AdminGlobal /></Protected>} />
                    <Route path="/create" element={<Protected><NeedsTenant><NeedsAccess><CreatePost /></NeedsAccess></NeedsTenant></Protected>} />
                    
                    <Route path="/conversas" element={<Protected><NeedsTenant><NeedsAccess><Topics /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/conversas/:topicId" element={<Protected><NeedsTenant><NeedsAccess><Topics /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/invite/:slug" element={<InviteLanding />} />
                    <Route path="/waiting" element={<WaitingApproval />} />
                    <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
                    <Route path="/requests" element={<Protected><Requests /></Protected>} />
                    <Route path="/members" element={<Protected><NeedsTenant><NeedsAccess><Members /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/groups" element={<Protected><NeedsTenant><NeedsAccess><Groups /></NeedsAccess></NeedsTenant></Protected>} />
                    <Route path="/profile" element={<Protected><Profile /></Protected>} />
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