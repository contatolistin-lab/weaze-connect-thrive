import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ArrowLeft, Users, UserPlus, UserMinus } from "lucide-react";
import { AddMembersModal } from "@/components/groups/AddMembersModal";
import { useGroupMembers } from "@/hooks/groups/useGroupMembers";
import { groupsService } from "@/services/groupsService";

type GroupMember = {
  id: string;
  user_id: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  };
};

type Group = {
  id: string;
  name: string;
  type: "private" | "internal";
};

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant, canManage } = useTenant();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const {
    searchResults,
    searching,
    loadMembers,
    addMember,
    searchMembers,
    clearSearch,
  } = useGroupMembers();

  useEffect(() => {
    if (!user || !canManage || !tenant || !groupId) {
      navigate("/");
      return;
    }
    loadGroup();
  }, [user, canManage, tenant, groupId, navigate]);

  const loadGroup = async () => {
    if (!groupId || !tenant) return;
    setLoading(true);

    const result = await groupsService.getGroup(groupId);
    setLoading(false);

    if (result.error || !result.data) {
      toast.error("Grupo não encontrado");
      navigate("/groups");
      return;
    }
    setGroup(result.data);
    loadMembers(groupId);
  };

  useEffect(() => {
    if (groupId) {
      const result = groupsService.getMembers(groupId);
      result.then((res) => {
        if (res.error) {
          toast.error("Erro ao carregar membros: " + res.error);
        } else {
          setMembers(res.data);
        }
      });
    }
  }, [groupId]);

  const handleAddMember = async (userId: string) => {
    if (!groupId || !user) return;
    const result = await addMember(groupId, userId, user.id);
    if (!result.success) {
      toast.error(result.error || "Erro ao adicionar membro");
    } else {
      toast.success("Membro adicionado!");
      setShowAddMembers(false);
      clearSearch();
      const res = await groupsService.getMembers(groupId);
      if (!res.error) setMembers(res.data);
    }
  };

  const handleSearchMembers = (query: string) => {
    if (!tenant?.id || !groupId) return;
    searchMembers(tenant.id, groupId, query);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    setRemovingId(memberId);

    const result = await groupsService.removeMember(memberId);

    setRemovingId(null);

    if (result.error) {
      toast.error("Erro ao remover membro");
    } else {
      toast.success("Membro removido");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/groups")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{group?.name}</h1>
            <p className="text-xs text-muted-foreground">
              {group?.type === "private" ? "Privado" : "Interno"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddMembers(true)}
            className="ml-auto"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum membro no grupo</p>
            <p className="text-sm mt-1">Adicione membros para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-card rounded-xl border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {member.profiles?.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        alt={member.profiles.name || ""}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {member.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {member.profiles?.name || "Usuário"}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removingId === member.id}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remover membro"
                >
                  {removingId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />

      <AddMembersModal
        open={showAddMembers}
        onClose={() => {
          setShowAddMembers(false);
          clearSearch();
        }}
        tenantId={tenant?.id || ""}
        groupId={groupId || ""}
        onAddMember={handleAddMember}
        onSearch={handleSearchMembers}
        onClearSearch={clearSearch}
        searchResults={searchResults}
        searching={searching}
        membersCount={members.length}
      />
    </div>
  );
}