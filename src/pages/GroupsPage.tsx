import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGroups } from "@/hooks/groups/useGroups";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { Users } from "lucide-react";

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant, canManage } = useTenant();

  const { groups, loading, error, loadGroups, createGroup, deleteGroup } = useGroups(
    tenant?.id || null
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupImages, setGroupImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !canManage || !tenant) {
      navigate("/");
      return;
    }
    loadGroups();
  }, [user, canManage, tenant, loadGroups, navigate]);

  const handleCreateGroup = async (name: string, type: "private" | "internal", image?: string | null) => {
    if (!user) return;
    const result = await createGroup(user.id, name, type);
    if (!result.success) {
      toast.error(result.error || "Erro ao criar grupo");
    } else {
      if (image && result.groupId) {
        setGroupImages(prev => ({ ...prev, [result.groupId!]: image }));
      }
      toast.success("Grupo criado!");
    }
  };

  const handleCopyInvite = async (groupId: string) => {
    if (!tenant) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const img = groupImages[groupId] || "";
    const params = new URLSearchParams({
      groupId: group.id,
      name: group.name,
      desc: group.type === "private" ? "Grupo Privado" : "Grupo Interno",
    });
    if (img) params.set("img", img);
    const link = `${window.location.origin}/groups/invite?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link de convite copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const result = await deleteGroup(groupId);
    if (!result.success) {
      toast.error(result.error || "Erro ao excluir grupo");
    } else {
      toast.success("Grupo excluído");
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Grupos</h1>
              <p className="text-xs text-muted-foreground">
                {groups.length} grupo{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand text-primary-foreground hover:opacity-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Criar
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhum grupo criado</p>
            <p className="text-muted-foreground text-sm mt-1">
              Crie grupos para organizar sua comunidade
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onDelete={handleDeleteGroup}
                canDelete={canManage}
                imageUrl={groupImages[group.id]}
                onCopyInvite={handleCopyInvite}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />

      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}