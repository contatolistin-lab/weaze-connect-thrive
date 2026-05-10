import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import ConversationList from "@/components/conversas/ConversationList";
import ConversationThread from "@/components/conversas/ConversationThread";
import CreateConversationDialog from "@/components/conversas/CreateConversationDialog";
import { useForumConversations } from "@/hooks/useForumConversations";
import { useForumReplies } from "@/hooks/useForumReplies";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ForumConversation } from "@/lib/forumConversations";

export default function Conversas() {
  const { tenant } = useTenant();
  const { user, isB2B } = useAuth();
  const [selectedConv, setSelectedConv] = useState<ForumConversation | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { conversations, loading, create, remove } = useForumConversations(tenant?.id || null);
  const { replies, loading: repliesLoading, submit, edit, remove: removeReply } = useForumReplies(selectedConv?.id || null);

  const handleCreate = async (title: string, description: string | null) => {
    if (!user) return;
    const conv = await create(user.id, title, description);
    if (conv) {
      setShowCreate(false);
      setSelectedConv(conv);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConv) return;
    await remove(selectedConv.id);
    setSelectedConv(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />

      <main className="flex-1 pb-24">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Conversas</h1>
          <p className="text-sm text-muted-foreground mt-1">Discussões da comunidade</p>
        </div>

        {isB2B && (
          <div className="p-4">
            <Button onClick={() => setShowCreate(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar nova conversa
            </Button>
          </div>
        )}

        <div className="px-4">
          <ConversationList
            conversations={conversations}
            loading={loading}
            onSelect={setSelectedConv}
          />
        </div>
      </main>

      <CreateConversationDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={handleCreate}
      />

      {selectedConv && (
        <ConversationThread
          conversation={selectedConv}
          replies={replies}
          loading={repliesLoading}
          currentUserId={user?.id || ""}
          isB2B={isB2B}
          onClose={() => setSelectedConv(null)}
          onSubmitReply={submit}
          onEditReply={edit}
          onDeleteReply={removeReply}
          onDeleteConversation={handleDeleteConversation}
        />
      )}

      <BottomNav />
    </div>
  );
}