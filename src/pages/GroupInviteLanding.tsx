import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Users, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupInviteLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const groupId = searchParams.get("groupId");
  const name = searchParams.get("name") || "Grupo";
  const desc = searchParams.get("desc") || "";
  const img = searchParams.get("img");

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-gray-500 mb-6">Este link de convite não é válido.</p>
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

  const handleAccept = async () => {
    if (!user) {
      toast.error("Faça login para entrar no grupo");
      navigate("/auth");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast.success("Você já é membro deste grupo");
        navigate(`/groups/${groupId}`);
        return;
      }

      const { error: joinError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          added_by: user.id,
        });

      if (joinError) {
        setError("Erro ao entrar no grupo");
        toast.error("Erro ao entrar no grupo");
        return;
      }

      toast.success("Você entrou no grupo!");
      navigate(`/groups/${groupId}`);
    } catch {
      setError("Erro ao processar convite");
      toast.error("Erro ao processar convite");
    }

    setJoining(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {img ? (
          <img
            src={img}
            alt={name}
            className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-xl border-4 border-white"
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Users className="h-10 w-10 text-white" />
          </div>
        )}

        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            {desc || "Grupo"}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Você foi convidado para o grupo
        </h1>
        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-6">
          {name}
        </p>

        <p className="text-gray-600 mb-8">
          Aceite o convite para participar e interagir com outros membros.
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={joining}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:opacity-90 shadow-lg px-8 py-4 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
          >
            {joining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Aceitar Convite
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/feed")}
            className="w-full inline-flex items-center justify-center gap-2 border-2 border-purple-200 bg-white hover:bg-purple-50 text-purple-700 hover:border-purple-300 px-8 py-4 rounded-full font-semibold text-lg transition-all"
          >
            Voltar
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Ao continuar, você concorda com os termos de uso da comunidade.
        </p>
      </motion.div>
    </div>
  );
}
