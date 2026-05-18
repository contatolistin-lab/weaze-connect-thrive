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
import { useGroupMembers } from "@/hooks/groups/useGroupMembers";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { AddMembersModal } from "@/components/groups/AddMembersModal";
import { GroupMemberItem } from "@/components/groups/GroupMemberItem";
import { Group } from "@/services/groupsService";
import { UserPlus, ArrowLeft, Users, Trash2 } from "lucide-react";

type ViewState = "list" | "detail";

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant, canManage } = useTenant();

  const { groups, loading, error, loadGroups, createGroup, deleteGroup } = useGroups(
    tenant?.id || null
  );
  const {
    members,
    searchResults,
    loading: membersLoading,
    searching,
    loadMembers,
    addMember,
    removeMember,
    searchMembers,
    clearSearch,
  } = useGroupMembers();

  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);

  useEffect(() => {
    if (!user || !canManage || !tenant) {
      navigate("/");
      return;
    }
    loadGroups();
  }, [user, canManage, tenant, loadGroups, navigate]);

  useEffect(() => {
    if (selectedGroup && viewState === "detail") {
      loadMembers(selectedGroup.id);
    }
  }, [selectedGroup, viewState, loadMembers]);

  const handleOpenGroup = (group: Group) => {
    setSelectedGroup(group);
    setViewState("detail");
  };

  const handleBackToList = () => {
    setViewState("list");
    setSelectedGroup(null);
    loadGroups();
  };

  const handleCreateGroup = async (name: string, type: "private" | "internal") => {
    if (!user) return;
    const result = await createGroup(user.id, name, type);
    if (!result.success) {
      toast.error(result.error || "Erro ao criar grupo");
    } else {
      toast.success("Grupo criado!");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirmDeleteGroup) {
      setConfirmDeleteGroup(true);
      toast.error("Clique novamente para confirmar exclusão");
      return;
    }
    const result = await deleteGroup(groupId);
    setConfirmDeleteGroup(false);
    if (!result.success) {
      toast.error(result.error || "Erro ao excluir grupo");
    } else {
      toast.success("Grupo excluído");
      if (selectedGroup?.id === groupId) {
        handleBackToList();
      }
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup || !user) return;
    const result = await addMember(selectedGroup.id, userId, user.id);
    if (!result.success) {
      toast.error(result.error || "Erro ao adicionar membro");
    } else {
      toast.success("Membro adicionado!");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    setRemovingMemberId(memberId);
    const result = await removeMember(memberId, selectedGroup.id);
    setRemovingMemberId(null);
    if (!result.success) {
      toast.error(result.error || "Erro ao remover membro");
    } else {
      toast.success("Membro removido");
    }
  };

  const handleSearchMembers = (query: string) => {
    if (!tenant?.id || !selectedGroup) {
      console.log("[GroupsPage] Search blocked: tenant=", tenant?.id, "group=", selectedGroup?.id);
      return;
    }
    console.log("[GroupsPage] Searching members:", { query, tenantId: tenant.id, groupId: selectedGroup.id });
    searchMembers(tenant.id, selectedGroup.id, query);
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

  if (viewState === "detail" && selectedGroup) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{selectedGroup.name}</h1>
              <p className="text-xs text-muted-foreground">
                {selectedGroup.type === "private" ? "Privado" : "Interno"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {members.length} membro{members.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddMembersModal(true)}
              className="bg-brand text-primary-foreground hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum membro ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <GroupMemberItem
                  key={member.id}
                  member={member}
                  onRemove={handleRemoveMember}
                  canRemove={true}
                  removing={removingMemberId === member.id}
                />
              ))}
            </div>
          )}

          <div className="mt-8 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleDeleteGroup(selectedGroup.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir grupo
            </Button>
          </div>
        </div>
        <BottomNav />

        <AddMembersModal
          open={showAddMembersModal}
          onClose={() => {
            setShowAddMembersModal(false);
            clearSearch();
          }}
          tenantId={tenant?.id || ""}
          groupId={selectedGroup.id}
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
                onOpen={handleOpenGroup}
                onDelete={handleDeleteGroup}
                canDelete={canManage}
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