import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export default function WaitingApproval() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const slug = searchParams.get("slug");
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(supabase);
  const tenantIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "pending" || !tenantIdRef.current || !userIdRef.current) return;

    const interval = setInterval(async () => {
      if (!tenantIdRef.current || !userIdRef.current) return;
      
      const { data: request } = await supabaseRef.current
        .from("community_requests")
        .select("status")
        .eq("tenant_id", tenantIdRef.current)
        .eq("user_id", userIdRef.current)
        .maybeSingle();
      
      if (request && request.status !== "pending") {
        setStatus(request.status as "approved" | "rejected");
        localStorage.removeItem("pending_invite_slug");
        sessionStorage.removeItem("pending_invite_slug");
        clearInterval(interval);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Slug não fornecido");
      return;
    }

    if (authLoading) return;

    if (!user) {
      setLoading(false);
      navigate("/auth", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .single();
      
      if (cancelled) return;
      
      if (tenantError || !tenantData) {
        setLoading(false);
        setError("Comunidade não encontrada");
        return;
      }
      
      setTenant(tenantData);
      tenantIdRef.current = tenantData.id;
      userIdRef.current = user.id;

      const { data: memberCheck } = await supabase
        .from("memberships")
        .select("id")
        .eq("tenant_id", tenantData.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (cancelled) return;

      if (memberCheck) {
        setStatus("approved");
        localStorage.removeItem("pending_invite_slug");
        sessionStorage.removeItem("pending_invite_slug");
        setLoading(false);
        return;
      }

      const { data: request } = await supabase
        .from("community_requests")
        .select("status")
        .eq("tenant_id", tenantData.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (cancelled) return;

      if (request) {
        setStatus(request.status as "pending" | "approved" | "rejected");
        localStorage.removeItem("pending_invite_slug");
        sessionStorage.removeItem("pending_invite_slug");
      } else {
        await supabase
          .from("community_requests")
          .upsert({ 
            tenant_id: tenantData.id, 
            user_id: user.id, 
            status: "pending" 
          }, {
            onConflict: "tenant_id,user_id"
          });
        setStatus("pending");
      }
      
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user, authLoading, navigate, supabase]);

  const handleGoHome = () => {
    localStorage.removeItem("pending_invite_slug");
    sessionStorage.removeItem("pending_invite_slug");
    
    const tenantId = tenantIdRef.current || tenant?.id;
    if (tenantId) {
      sessionStorage.setItem("just_joined_community", tenantId);
      localStorage.setItem("weaze:active_tenant", tenantId);
    }
    
    navigate("/feed");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-500">Processando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Comunidade não encontrada</h1>
          <p className="text-gray-500 mb-6">Este link pode estar incorreto ou expirado.</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso liberado!</h1>
          <p className="text-gray-600 mb-8">
            Sua solicitação foi aprovada. Você agora é membro da comunidade <strong>{tenant.name}</strong>.
          </p>
          <Button onClick={handleGoHome} className="w-full bg-brand">
            <Users className="h-4 w-4 mr-2" />
            Entrar na comunidade
          </Button>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitação recusada</h1>
          <p className="text-gray-600 mb-8">
            Infelizmente sua solicitação para entrar na comunidade <strong>{tenant.name}</strong> foi recusada.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
      <div className="text-center max-w-md">
        {tenant.logo_url ? (
          <img src={tenant.logo_url} alt={tenant.name} className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-xl" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-4xl font-bold text-white">{tenant.name[0]?.toUpperCase()}</span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitação enviada</h1>
        <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          {tenant.name}
        </p>
        <p className="text-gray-600 mb-8">
          Sua solicitação foi enviada para a comunidade.<br />
          <strong>Aguarde aprovação do responsável.</strong>
        </p>
        
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-center gap-2 text-purple-600">
            <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
            <span className="font-medium">Aguardando aprovação</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <p className="text-xs text-gray-400">
            Você será notificado quando sua solicitação for aprovada.
          </p>
        </div>
      </div>
    </div>
  );
}