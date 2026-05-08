import { ArrowLeft, Users, MoreHorizontal, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Conversation, ConversationMember } from "@/lib/conversations";

type Props = {
  conversation: Conversation | null | undefined;
  members: ConversationMember[];
  onBack: () => void;
  onMembersClick: () => void;
  showBack?: boolean;
};

const visibilityConfig = {
  public: { label: "Pública", desc: "Todos os membros podem participar", color: "text-green-700 bg-green-50 border-green-200" },
  private: { label: "Privada", desc: "Apenas membros convidados", color: "text-amber-700 bg-amber-50 border-amber-200" },
  internal: { label: "Interna", desc: "Apenas equipe da marca", color: "text-purple-700 bg-purple-50 border-purple-200" },
};

export default function ConversationHeader({
  conversation,
  members,
  onBack,
  onMembersClick,
  showBack = true,
}: Props) {
  if (!conversation) {
    return (
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="animate-pulse flex-1 h-4 bg-gray-200 rounded w-1/3" />
      </header>
    );
  }

  const vc = visibilityConfig[conversation.visibility] || visibilityConfig.public;

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900 truncate">{conversation.title}</h1>
            <Badge className={`text-[10px] px-1.5 py-0.5 border ${vc.color}`}>{vc.label}</Badge>
          </div>
          {conversation.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{conversation.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-1.5 text-xs h-8 border-gray-200"
          onClick={onMembersClick}
        >
          <Users className="h-3.5 w-3.5" />
          <span>{members.length}</span>
        </Button>
      </div>
    </header>
  );
}
