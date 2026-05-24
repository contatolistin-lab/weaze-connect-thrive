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
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowBanner(true);
    window.addEventListener('sw-update-ready', handleUpdate);
    return () => window.removeEventListener('sw-update-ready', handleUpdate);
  }, []);

  // NOTE: No auto-reload here. Silently reloading caused Auth/Tenant to
  // reinitialize at unpredictable moments, leading to infinite loading states.
  // User must explicitly click the banner to apply the update.

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-purple-700 text-white text-sm text-center py-2 px-4 cursor-pointer"
      onClick={() => {
        // Tell the waiting SW to take control, then reload
        const waiting = (window as any).__swWaitingWorker;
        if (waiting) {
          waiting.postMessage('skipWaiting');
          // Give the SW a moment to activate before reloading
          setTimeout(() => window.location.reload(), 300);
        } else {
          window.location.reload();
        }
      }}
    >
      Nova versão disponível — clique para atualizar
    </div>
  );
};

const VisibilityGuard = () => {
  const hiddenSinceRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else {
        if (hiddenSinceRef.current > 0 && Date.now() - hiddenSinceRef.current > 60_000) {
          supabase.auth.getSession();
        }
        hiddenSinceRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return null;
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
const AuthB2B = lazy(() => import("./pages/AuthB2B"));
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
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const GroupsPageB2C = lazy(() => import("./pages/b2c/GroupsPageB2C"));
const GroupDetailB2C = lazy(() => import("./pages/b2c/GroupDetailB2C"));
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
const ShareLanding = lazy(() => import("./pages/ShareLanding"));
const WaitingApproval = lazy(() => import("./pages/WaitingApproval"));
const BlockedPage = lazy(() => import("./pages/BlockedPage"));

const Protected = ({ children }: { children: JSX.Element }) => {
  const { user, loading: authLoading, initializing, isB2C, appRole } = useAuth();
  const { loading: tenantLoading, tenant, blocked } = useTenant();
  const tenantEverLoaded = useRef(false);
  const appRoleStuckRef = useRef<number>(0);

  if (!tenantLoading) tenantEverLoaded.current = true;

  if (initializing) return <Loading />;
  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user && appRole === null) {
    if (appRoleStuckRef.current === 0) {
      appRoleStuckRef.current = Date.now();
    } else if (Date.now() - appRoleStuckRef.current > 10_000) {
      appRoleStuckRef.current = 0;
      return <Navigate to="/auth" replace />;
    }
    return <Loading />;
  }
  appRoleStuckRef.current = 0;
  if (tenantLoading && !tenantEverLoaded.current) return <Loading />;
  if (blocked) return <Navigate to="/blocked" replace />;
  if (!tenant) {
    if (isB2C) {
      return children;
    }
    return <Navigate to="/communities" replace />;
  }

  return children;
};

const B2BOnly = ({ children }: { children: JSX.Element }) => {
  const { user, loading, initializing, isB2B } = useAuth();
  const { isOwner, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || tenantLoading || initializing) return;
    if (!user) return;
    if (!isB2B && !isOwner) {
      navigate("/feed", { replace: true });
    }
  }, [loading, tenantLoading, initializing, isOwner, isB2B, user, navigate]);

  if (initializing) return <Loading />;
  if (loading || tenantLoading) return <Loading />;
  if (!isB2B && !isOwner) return null;
  return children;
};

const NeedsTenant = ({ children }: { children: JSX.Element }) => {
  const { user, loading: authLoading, initializing } = useAuth();
  const { loading, tenant } = useTenant();

  if (initializing) return <Loading />;
  if (authLoading || loading) return <Loading />;
  return children;
};

const NeedsAccess = ({ children }: { children: JSX.Element }) => {
  const { user, loading, initializing } = useAuth();

  if (initializing) return <Loading />;
  if (loading) return <Loading />;
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
        <VisibilityGuard />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <AuthProvider>
              <TenantProvider>
                <OnboardingTour />
                <AppEntrance>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/b2b" element={<AuthB2B />} />
                    <Route path="/m/:slug" element={<CommunityPage />} />
                    <Route path="/c/:slug" element={<CommunityPage />} />
                    <Route path="/community/:slug" element={<CommunityPage />} />
                    <Route path="/m" element={<CommunityPage />} />
                    <Route path="/c" element={<CommunityPage />} />
                    <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
<Route path="/communities" element={<Protected><B2BOnly><Communities /></B2BOnly></Protected>} />
                    <Route path="/feed" element={<Protected><Feed /></Protected>} />
                    <Route path="/messages" element={<Protected><Messages /></Protected>} />
                    <Route path="/content" element={<Navigate to="/create" replace />} />
                    <Route path="/content/agenda" element={<Protected><AdminContent /></Protected>} />
                    <Route path="/content/services" element={<Protected><AdminContent /></Protected>} />
                    <Route path="/content/events" element={<Protected><AdminContent /></Protected>} />
                    <Route path="/content/lives" element={<Protected><Lives /></Protected>} />
                    <Route path="/admin/*" element={<Protected><AdminLayout /></Protected>} />
                    <Route path="/metrics" element={<Protected><AdminOverview /></Protected>} />
                    <Route path="/metrics/revenue" element={<Protected><AdminRevenue /></Protected>} />
                    <Route path="/metrics/funnel" element={<Protected><AdminFunnel /></Protected>} />
                    <Route path="/metrics/users" element={<Protected><AdminUsers /></Protected>} />
                    
                    <Route path="/metrics/tenants" element={<Protected><AdminTenants /></Protected>} />
                    <Route path="/metrics/content" element={<Protected><AdminContent /></Protected>} />
                    <Route path="/metrics/invites" element={<Protected><InviteLinks /></Protected>} />
                    <Route path="/admin" element={<Protected><AdminGlobal /></Protected>} />
                    <Route path="/create" element={<Protected><CreatePost /></Protected>} />
                    
                    <Route path="/conversas" element={<Protected><Topics /></Protected>} />
                    <Route path="/conversas/:topicId" element={<Protected><Topics /></Protected>} />
                    <Route path="/invite/:slug" element={<InviteLanding />} />
                    <Route path="/compartilhar/:tenantId/:postId" element={<ShareLanding />} />
                    <Route path="/waiting" element={<WaitingApproval />} />
                    <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
                    <Route path="/requests" element={<Protected><Requests /></Protected>} />
                    <Route path="/members" element={<Protected><Members /></Protected>} />
                    <Route path="/groups" element={<Protected><GroupsPage /></Protected>} />
                    <Route path="/groups/b2c" element={<Protected><GroupsPageB2C /></Protected>} />
                    <Route path="/groups/member/:groupId" element={<Protected><GroupDetailB2C /></Protected>} />
                    <Route path="/groups/:groupId" element={<Protected><GroupDetail /></Protected>} />
                    <Route path="/profile" element={<Protected><Profile /></Protected>} />
                    <Route path="/offline" element={<Offline />} />
                    <Route path="/blocked" element={<BlockedPage />} />
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