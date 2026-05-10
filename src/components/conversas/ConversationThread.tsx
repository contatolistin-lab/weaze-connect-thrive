import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ConversationReply from "./ConversationReply";
import ReplyBox from "./ReplyBox";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";
import type { ForumConversation, ForumReply } from "@/lib/forumConversations";

interface ConversationThreadProps {
  conversation: ForumConversation;
  replies: ForumReply[];
  loading: boolean;
  currentUserId: string;
  isB2B: boolean;
  onClose: () => void;
  onSubmitReply: (content: string, replyToId: string | null) => Promise<void>;
  onEditReply: (id: string, content: string) => Promise<void>;
  onDeleteReply: (id: string) => Promise<void>;
  onDeleteConversation: () => Promise<void>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationThread({
  conversation,
  replies,
  loading,
  currentUserId,
  isB2B,
  onClose,
  onSubmitReply,
  onEditReply,
  onDeleteReply,
  onDeleteConversation,
}: ConversationThreadProps) {
  const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authorName = conversation.profiles?.name || "Usuário";
  const authorAvatar = conversation.profiles?.avatar_url || "";

  const handleSubmitReply = async (content: string) => {
    await onSubmitReply(content, replyingTo?.id || null);
    setReplyingTo(null);
  };

  const startEdit = (reply: ForumReply) => {
    setEditingId(reply.id);
    setEditContent(reply.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await onEditReply(editingId, editContent.trim());
    cancelEdit();
  };

  const handleDeleteReply = async () => {
    if (!deletingId) return;
    await onDeleteReply(deletingId);
    setDeletingId(null);
  };

  const isConversationOwner = conversation.user_id === currentUserId;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-foreground truncate">{conversation.title}</h2>
        </div>
        {isB2B && (
          <button onClick={onDeleteConversation} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {authorName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{authorName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(conversation.created_at)}</p>
            </div>
          </div>
          {conversation.description && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{conversation.description}</p>
          )}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : replies.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma resposta ainda</p>
          </div>
        ) : (
          replies.map((reply) => (
            <div key={reply.id}>
              {editingId === reply.id ? (
                <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
                    <Button size="sm" onClick={saveEdit} disabled={!editContent.trim()}>Salvar</Button>
                  </div>
                </div>
              ) : (
                <ConversationReply
                  reply={reply}
                  isOwner={reply.user_id === currentUserId}
                  onReply={setReplyingTo}
                  onEdit={startEdit}
                  onDelete={() => setDeletingId(reply.id)}
                />
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <ReplyBox
          onSubmit={handleSubmitReply}
          replyToName={replyingTo?.profiles?.name}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-medium">Excluir resposta?</h3>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteReply} className="flex-1">
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}