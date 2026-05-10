import ConversationCard from "./ConversationCard";
import type { ForumConversation } from "@/lib/forumConversations";

interface ConversationListProps {
  conversations: ForumConversation[];
  loading: boolean;
  onSelect: (conversation: ForumConversation) => void;
}

export default function ConversationList({ conversations, loading, onSelect }: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Nenhuma conversa ainda</p>
        <p className="text-xs mt-1">Crie a primeira conversa!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <ConversationCard key={conv.id} conversation={conv} onClick={() => onSelect(conv)} />
      ))}
    </div>
  );
}