import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Clock } from "lucide-react";
import type { ForumConversation } from "@/lib/forumConversations";

interface ConversationCardProps {
  conversation: ForumConversation;
  onClick: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const authorName = conversation.profiles?.name || "Usuário";
  const authorAvatar = conversation.profiles?.avatar_url || "";

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={authorAvatar} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {authorName[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-1">{conversation.title}</h3>
          {conversation.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {conversation.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {conversation.replies_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(conversation.last_reply_at || conversation.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}