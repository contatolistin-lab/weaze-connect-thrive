import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCommunityAccess, requestCommunityAccess, AccessStatus } from "@/lib/communityAccess";
import { Building2, Users, MessageCircle, Calendar, ArrowRight, Clock, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PublicTenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  city: string | null;
};

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isB2B } = useAuth();
  
  const getSlugFromUrl = () => {
    if (slug) return slug;
    const params = new URLSearchParams(location.search);
    return params.get("slug") || params.get("s") || "";
  };
  
  const communitySlug = getSlugFromUrl();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("none");
  const [requesting, setRequesting] = useState(false);

  console.log("CommunityPage - isB2B:", isB2B, "user:", user?.id);

  useEffect(() => {
    if (!communitySlug) {
      setError("Slug não fornecido");
      setLoading(false);
      return;
    }

    (async () => {
      const { data: tenantData, error: err } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, bio, city")
        .eq("slug", communitySlug)
        .maybeSingle();

      if (err || !tenantData) {
        setError("Comunidade não encontrada");
        setLoading(false);
        return;
      }

      setTenant(tenantData);

      // === REGRA PRINCIPAL: B2B TEM ACESSO TOTAL ===
      if (isB2B) {
        // Limpar qualquer localStorage para evitar conflito
        localStorage.removeItem(`community_${communitySlug}`);
        setAccessStatus("approved");
        console.log("B2B detected - access approved");
        setLoading(false);
        return;
      }

      // === PARA B2C: APLICAR CONTROLE VIA LOCALSTORAGE ===
      const access = getCommunityAccess(communitySlug);
      setAccessStatus(access);
      console.log("B2C access:", access);
      
      setLoading(false);
    })();
  }, [communitySlug, isB2B]);

  const handleRequestAccess = () => {
    if (!communitySlug) return;
    setRequesting(true);
    const status = requestCommunityAccess(communitySlug);
    setAccessStatus(status);
    setRequesting(false);
    toast.success("Solicitação enviada! Aguarde aprovação da marca.");
  };

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando comunidade...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Comunidade não encontrada</h1>
          <p className="text-muted-foreground mb-6">{error || "Esta comunidade não existe ou foi removida."}</p>
          <Button asChild>
            <a href="/">Ir para página inicial</a>
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // === B2B: SEMPRE LIBERADO ===
    if (isB2B) {
      return (
        <div className="bg-green-50 rounded-3xl border border-green-200 p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-8 w-8" />
            <h2 className="font-semibold text-lg">Bem-vindo!</h2>
          </div>
          <p className="text-green-800">
            Você é membro de <strong>{tenant.name}</strong>!
          </p>
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={() => navigate(`/feed`)}>
            Entrar na Comunidade
          </Button>
        </div>
      );
    }

    // === B2C: SEM LOGIN ===
    if (!user) {
      return (
        <div className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-soft">
          <h2 className="font-semibold text-lg">Bem-vindo à comunidade!</h2>
          <p className="text-muted-foreground">
            Junte-se a {tenant.name} para ter acesso a conteúdo exclusivo, eventos, 
            promoções e muito mais.
          </p>
          
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-brand" />
              <p className="font-semibold">Membros</p>
              <p className="text-sm text-muted-foreground">Comunidade ativa</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-brand" />
              <p className="font-semibold">Conteúdo</p>
              <p className="text-sm text-muted-foreground">Postagens diárias</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-brand" />
              <p className="font-semibold">Eventos</p>
              <p className="text-sm text-muted-foreground">Exclusivos</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <ArrowRight className="h-6 w-6 mx-auto mb-2 text-brand" />
              <p className="font-semibold">Ofertas</p>
              <p className="text-sm text-muted-foreground">Só para membros</p>
            </div>
          </div>

          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" asChild>
            <a href={`/auth?redirect=/c?slug=${tenant.slug}`}>Entrar na comunidade</a>
          </Button>
        </div>
      );
    }

    // === B2C: PENDING ===
    if (accessStatus === "pending") {
      return (
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-3 text-amber-700">
            <Clock className="h-8 w-8" />
            <h2 className="font-semibold text-lg">Aguardando Aprovação</h2>
          </div>
          <p className="text-amber-800">
            Sua solicitação foi enviada para <strong>{tenant.name}</strong>. 
            Você receberá uma notificação quando seu acesso for aprovado.
          </p>
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-700">
              Enquanto isso, você pode explorar outras comunidades ou voltar mais tarde.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Explorar
            </Button>
          </div>
        </div>
      );
    }

    // === B2C: REJECTED ===
    if (accessStatus === "rejected") {
      return (
        <div className="bg-red-50 rounded-3xl border border-red-200 p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-8 w-8" />
            <h2 className="font-semibold text-lg">Acesso Recusado</h2>
          </div>
          <p className="text-red-800">
            Seu acesso à <strong>{tenant.name}</strong> não foi aprovado neste momento.
          </p>
          <p className="text-sm text-red-600">
            Entre em contato diretamente com a marca para mais informações.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      );
    }

    // === B2C: APPROVED ===
    if (accessStatus === "approved") {
      return (
        <div className="bg-green-50 rounded-3xl border border-green-200 p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-8 w-8" />
            <h2 className="font-semibold text-lg">Bem-vindo!</h2>
          </div>
          <p className="text-green-800">
            Você é membro de <strong>{tenant.name}</strong>!
          </p>
          <Button className="w-full bg-brand text-primary-foreground hover:opacity-90" onClick={() => navigate(`/feed`)}>
            Entrar na Comunidade
          </Button>
        </div>
      );
    }

    // === B2C: SEM STATUS - SOLICITAR ACESSO ===
    return (
      <div className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-soft">
        <h2 className="font-semibold text-lg">Solicitar Entrada</h2>
        <p className="text-muted-foreground">
          Solicite acesso a <strong>{tenant.name}</strong> para receber conteúdo exclusivo.
        </p>
        
        <Button 
          className="w-full bg-brand text-primary-foreground hover:opacity-90" 
          onClick={handleRequestAccess}
          disabled={requesting}
        >
          {requesting ? "Enviando..." : "Solicitar Acesso"}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="h-24 w-24 rounded-3xl bg-brand mx-auto mb-4 grid place-items-center text-primary-foreground text-3xl font-bold overflow-hidden">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-12 w-12" />
            )}
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{tenant.name}</h1>
          {tenant.bio && <p className="text-muted-foreground mb-2">{tenant.bio}</p>}
          {tenant.city && <p className="text-sm text-muted-foreground">{tenant.city}</p>}
        </div>

        {renderContent()}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by Community Commerce Hub
        </p>
      </div>
    </div>
  );
}