import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, User, MapPin, Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import { toggleMemberActive, getTenantMembers } from "@/lib/communityAccess";

type Member = {
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profiles: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

export default function Members() {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isB2B || !tenant) {
      navigate("/");
      return;
    }
    loadMembers();
  }, [user, isB2B, tenant]);

  const loadMembers = async () => {
    if (!user || !tenant) return;
    setLoading(true);
    const { data, error } = await getTenantMembers(tenant.id, user.id);
    if (error) {
      toast.error("Erro ao carregar membros");
      setMembers([]);
    } else {
      setMembers(data);
    }
    setLoading(false);
  };

  const handleToggleActive = async (member: Member) => {
    if (!user || !tenant) return;
    setToggling(member.user_id);
    const newStatus = !member.is_active;
    const result = await toggleMemberActive(member.user_id, tenant.id, user.id, newStatus);
    setToggling(null);
    if (result.success) {
      toast.success(newStatus ? "Membro ativado" : "Membro desativado");
      setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, is_active: newStatus } : m));
    } else {
      toast.error(result.error || "Erro ao atualizar");
    }
  };

  const handleSendMessage = async (member: Member) => {
    if (!user || !tenant || sendingMessage) return;
    
    setSendingMessage(member.user_id);
    
    try {
      const { data: existingThread } = await supabase
        .from("message_threads")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("user_id", member.user_id)
        .maybeSingle();

      let threadId = existingThread?.id;

      if (!threadId) {
        const { data: newThread, error: createError } = await supabase
          .from("message_threads")
          .insert({ tenant_id: tenant.id, user_id: member.user_id })
          .select("id")
          .single();
        
        if (createError) {
          if (createError.code === "23505") {
            const { data: retryThread } = await supabase
              .from("message_threads")
              .select("id")
              .eq("tenant_id", tenant.id)
              .eq("user_id", member.user_id)
              .maybeSingle();
            threadId = retryThread?.id;
          } else {
            toast.error("Erro ao criar conversa");
            setSendingMessage(null);
            return;
          }
        } else {
          threadId = newThread?.id;
        }
      }

      if (threadId) {
        navigate(`/messages?thread=${threadId}`);
      } else {
        toast.error("Erro ao iniciar conversa");
      }
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#630091]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#630091] flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Membros</h1>
            <p className="text-xs text-gray-500">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum membro encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Os membros aparecerão aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {members.map((member) => {
              const profile = member.profiles;
              
              return (
                <div 
                  key={member.user_id} 
                  className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${
                    member.is_active 
                      ? "border-gray-100 hover:shadow-md" 
                      : "border-orange-200 bg-orange-50/50"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full overflow-hidden mb-3 ${member.is_active ? 'bg-gray-100' : 'bg-orange-100'}`}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${member.is_active ? 'text-gray-400' : 'text-orange-400'}`}>
                          <User className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    <p className="font-semibold text-gray-900 text-center truncate w-full text-sm">
                      {profile?.name || "Usuário"}
                    </p>
                    
                    {(profile?.city || profile?.state) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {profile.city}{profile.state ? `, ${profile.state}` : ""}
                      </p>
                    )}
                    
                    <div className="mt-3 w-full">
                      <button
                        onClick={() => handleToggleActive(member)}
                        disabled={toggling === member.user_id}
                        className={`w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          member.is_active 
                            ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200" 
                            : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                        } ${toggling === member.user_id ? "opacity-50" : ""}`}
                      >
                        {toggling === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : member.is_active ? (
                          <>
                            <Check className="h-4 w-4" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            Inativo
                          </>
                        )}
                      </button>
                    </div>
                    
                    <Button
                      onClick={() => handleSendMessage(member)}
                      size="sm"
                      disabled={sendingMessage === member.user_id}
                      className="w-full mt-2 bg-[#630091] text-white hover:bg-[#52007a] rounded-xl disabled:opacity-50"
                    >
                      {sendingMessage === member.user_id ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                      )}
                      Mensagem
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}