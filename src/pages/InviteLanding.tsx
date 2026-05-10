import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Loader2, Users } from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export default function InviteLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const ref = searchParams.get("ref");
  const campaign = searchParams.get("campaign");

  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    (async () => {
      const { data, error: e } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .single();
      
      if (e || !data) {
        setError("Comunidade não encontrada");
        setLoading(false);
        return;
      }
      
      setTenant(data);
      
      // Track visit
      await supabase.from("invite_link_events").insert({
        tenant_id: data.id,
        event_type: "visit",
        ref: ref || null,
        campaign: campaign || null,
      });
      
      // Se não está logado, salvar slug para recuperação após login
      if (!user) {
        localStorage.setItem("pending_invite_slug", slug);
      }
      
      setLoading(false);
    })();
  }, [slug, ref, campaign, user]);

  // Se usuário autenticado, entrar automaticamente
  useEffect(() => {
    if (user && tenant && !authLoading && !processing) {
      handleEnter();
    }
  }, [user, tenant, authLoading, processing]);

  const handleEnter = async () => {
    if (!tenant || !user) return;
    setProcessing(true);
    
    localStorage.setItem("pending_invite_slug", tenant.slug);
    localStorage.removeItem("pending_invite_slug");
    navigate(`/waiting?slug=${tenant.slug}`);
  };

  const handleAuth = (isSignUp: boolean) => {
    if (slug) {
      localStorage.setItem("pending_invite_slug", slug);
    }
    const authParams = new URLSearchParams();
    if (ref) authParams.set("ref", ref);
    if (campaign) authParams.set("campaign", campaign);
    if (isSignUp) authParams.set("mode", "signup");
    
    navigate(`/auth?${authParams.toString()}`);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando comunidade...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Comunidade não encontrada</h1>
          <p className="text-gray-500 mb-6">{error || "Este link pode estar expirado ou ser inválido."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Logo da comunidade */}
        {tenant.logo_url ? (
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-xl border-4 border-white"
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-4xl font-bold text-white">{tenant.name[0]?.toUpperCase()}</span>
          </div>
        )}
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Comunidade privada</span>
        </div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Você foi convidado para a comunidade
        </h1>
        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-6">
          {tenant.name}
        </p>
        
        <p className="text-gray-600 mb-8">
          Crie sua conta ou faça login para acessar conteúdo exclusivo e interagir com outros membros.
        </p>
        
        {/* Botões de ação */}
        <div className="space-y-3">
          {user ? (
            <button
              onClick={handleEnter}
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:opacity-90 shadow-lg px-8 py-4 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Entrar na comunidade
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAuth(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:opacity-90 shadow-lg px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                <Sparkles className="h-5 w-5" />
                Criar minha conta
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => handleAuth(false)}
                className="w-full inline-flex items-center justify-center gap-2 border-2 border-purple-200 bg-white hover:bg-purple-50 text-purple-700 hover:border-purple-300 px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                Já tenho conta - Entrar
              </button>
            </>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          Ao continuar, você concorda com os termos de uso da comunidade.
        </p>
      </motion.div>
    </div>
  );
}