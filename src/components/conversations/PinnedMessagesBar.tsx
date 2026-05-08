import { AnimatePresence, motion } from "framer-motion";
import { Pin, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ConversationMessage } from "@/lib/conversations";

type Props = {
  messages: ConversationMessage[];
  onUnpin: (id: string) => void;
  onGoToMessage: (id: string) => void;
  canModerate: boolean;
  pinned: ConversationMessage[];
};

function formatTime(dateStr: string | undefined | null): string {
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
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PinnedMessagesBar({ messages, pinned, onUnpin, onGoToMessage, canModerate }: Props) {
  if (!pinned || pinned.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#630091]/5 via-[#d81e62]/5 to-[#630091]/5 border-b border-[#630091]/10">
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Pin className="h-3.5 w-3.5 text-[#630091]" />
          <span className="text-[11px] font-medium text-[#630091] uppercase tracking-wider">
            Mensagens importantes ({pinned.length}/3)
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          <AnimatePresence>
            {pinned.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-shrink-0 w-56 bg-white rounded-xl border border-[#630091]/10 shadow-sm p-3"
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                    <AvatarImage src={msg.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] bg-[#630091]/10 text-[#630091]">
                      {msg.profiles?.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-gray-700 truncate">
                        {msg.profiles?.name || "Usuário"}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 flex-shrink-0 text-gray-400 hover:text-[#630091]"
                        onClick={() => onGoToMessage(msg.id)}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{msg.content}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{formatTime(msg.pinned_at)}</span>
                      {canModerate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-red-500"
                          onClick={() => onUnpin(msg.id)}
                        >
                          Desfixar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
