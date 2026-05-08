import { useState, useRef, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import ConversationSidebar from "@/components/conversations/ConversationSidebar";
import ConversationView from "@/components/conversations/ConversationView";
import MembersSheet from "@/components/conversations/MembersSheet";
import CreateConversationDialog from "@/components/conversations/CreateConversationDialog";
import { useConversations, useConversation, useSearchMembers } from "@/hooks/useConversations";
import { toast } from "sonner";
import { Hash, Plus } from "lucide-react";
import type { ConversationVisibility, ConversationRole } from "@/lib/conversations";

export default function ConversationsPage() {
  const { tenant } = useTenant();
  const { user, isB2B } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyPreview, setReplyPreview] = useState<{ id: string; name: string; content: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, isLoading: convLoading, createConversation, isCreating } = useConversations(
    tenant?.id ?? "",
    user?.id ?? ""
  );

  const {
    conversation,
    messages,
    pinned,
    members,
    myRole,
    isLoadingConversation,
    isLoadingMessages,
    isSending,
    sendMessage,
    updateMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    addMember,
    removeMember,
    updateMemberRole,
  } = useConversation(selectedId, user?.id ?? "");

  const { search, setSearch, results, searching } = useSearchMembers(selectedId);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages.length]);

  useEffect(() => {
    setReplyPreview(null);
  }, [selectedId]);

  const handleSend = (content: string, replyTo?: string | null) => {
    if (!selectedId || !user) return;
    sendMessage({ content, replyTo });
    setReplyPreview(null);
  };

  const handleEdit = (messageId: string, content: string) => {
    updateMessage({ messageId, content });
  };

  const handleDelete = (messageId: string) => {
    deleteMessage(messageId);
    toast.success("Mensagem removida");
  };

  const handlePin = async (messageId: string) => {
    const result = await pinMessage(messageId);
    if (!result.success) {
      toast.error(result.error || "Erro ao fixar mensagem");
    } else {
      toast.success("Mensagem fixada");
    }
  };

  const handleUnpin = (messageId: string) => {
    unpinMessage(messageId);
    toast.success("Fixação removida");
  };

  const handleReply = (msg: any) => {
    setReplyPreview({ id: msg.id, name: msg.profiles?.name || "usuário", content: msg.content });
  };

  const handleCreate = (title: string, description: string, visibility: ConversationVisibility) => {
    createConversation({ title, description, visibility });
    setShowCreate(false);
    toast.success(`Conversa "${title}" criada`);
  };

  const handleAddMember = (userId: string, role: ConversationRole) => {
    addMember({ userId, role });
  };

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <TopBar />
      <main className="flex-1 flex overflow-hidden pb-16">
        <ConversationSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={() => setShowCreate(true)}
          onArchive={(id) => { setSelectedId(null); }}
          isB2B={isB2B}
          isLoading={convLoading}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#630091]/10 to-[#d81e62]/10 flex items-center justify-center mb-6">
                <Hash className="h-10 w-10 text-[#630091]/30" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Selecione uma conversa</h2>
              <p className="text-sm text-gray-400 text-center max-w-xs mb-6">
                Escolha uma conversa na lista ao lado para começar a interagir.
              </p>
              {isB2B && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#630091] to-[#d81e62] text-white px-6 py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                  Criar nova conversa
                </button>
              )}
            </div>
          ) : (
            <ConversationView
              conversation={conversation}
              messages={messages}
              pinned={pinned}
              members={members}
              myRole={myRole}
              isLoadingConversation={isLoadingConversation || isLoadingMessages}
              isSending={isSending}
              onBack={() => setSelectedId(null)}
              onSend={handleSend}
              onEditMessage={handleEdit}
              onDeleteMessage={handleDelete}
              onPinMessage={handlePin}
              onUnpinMessage={handleUnpin}
              onReplyToMessage={handleReply}
              replyPreview={replyPreview}
              onCancelReply={() => setReplyPreview(null)}
              mentionUsers={results}
              onMembersClick={() => setShowMembers(true)}
              userId={user?.id ?? ""}
            />
          )}
        </div>
      </main>

      <CreateConversationDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        isCreating={isCreating}
      />

      <MembersSheet
        open={showMembers}
        onClose={() => setShowMembers(false)}
        members={members}
        conversationId={selectedId}
        onAddMember={handleAddMember}
        onRemoveMember={removeMember}
        onUpdateRole={updateMemberRole}
        searchResults={results}
        onSearch={setSearch}
        searchQuery={search}
        isSearching={searching}
        canModerate={myRole === "owner" || myRole === "moderator"}
      />

      <BottomNav />
    </div>
  );
}
