import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { ForumReply } from "@/lib/forumConversations";

interface ConversationReplyProps {
  reply: ForumReply;
  isOwner: boolean;
  onReply: (reply: ForumReply) => void;
  onEdit: (reply: ForumReply) => void;
  onDelete: (reply: ForumReply) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ConversationReply({ reply, isOwner, onReply, onEdit, onDelete }: ConversationReplyProps) {
  const authorName = reply.profiles?.name || "Usuário";
  const authorAvatar = reply.profiles?.avatar_url || "";

  return (
    <div className="flex gap-3 p-4 bg-card rounded-xl border border-border">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={authorAvatar} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {authorName[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{authorName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => onReply(reply)} className="text-xs h-7 px-2">
            Responder
          </Button>
          {isOwner && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(reply)} className="text-xs h-7 px-2">
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(reply)} className="text-xs h-7 px-2 text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}