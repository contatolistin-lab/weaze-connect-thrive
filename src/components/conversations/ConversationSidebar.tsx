import { motion, AnimatePresence } from "framer-motion";
import { Lock, Users, Hash, MoreHorizontal, Plus, Archive, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/lib/conversations";

type Props = {
  conversations: Array<Conversation & { my_role: string | null }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onArchive?: (id: string) => void;
  isB2B: boolean;
  isLoading: boolean;
};

const visibilityConfig = {
  public: { icon: Hash, label: "Pública", color: "text-green-600 bg-green-50" },
  private: { icon: Lock, label: "Privada", color: "text-amber-600 bg-amber-50" },
  internal: { icon: Users, label: "Interna", color: "text-purple-600 bg-purple-50" },
};

function formatRelativeTime(dateStr: string | undefined | null): string {
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

export default function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onCreate,
  onArchive,
  isB2B,
  isLoading,
}: Props) {
  return (
    <aside className="w-full sm:w-72 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Conversas</h2>
          {isB2B && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCreate}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400">Comunicação segmentada</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <Hash className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <nav className="py-2">
            <AnimatePresence>
              {conversations.map((conv, i) => {
                const vc = visibilityConfig[conv.visibility] || visibilityConfig.public;
                const VisIcon = vc.icon;
                const isSelected = conv.id === selectedId;

                return (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => onSelect(conv.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors relative group ${
                      isSelected ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${isSelected ? "bg-gradient-to-br from-[#630091] to-[#d81e62]" : "bg-gray-100"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {isSelected ? (
                        <VisIcon className="h-4 w-4 text-white" />
                      ) : (
                        <VisIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-medium truncate ${isSelected ? "text-[#630091]" : "text-gray-900"}`}>
                          {conv.title}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatRelativeTime(conv.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${vc.color}`}>
                          <VisIcon className="h-2.5 w-2.5 mr-0.5" />
                          {vc.label}
                        </Badge>
                        {conv.my_role && conv.my_role !== "member" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-[#630091]/20 text-[#630091]">
                            {conv.my_role === "owner" ? "responsável" : "mod"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isB2B && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); onArchive?.(conv.id); }}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </nav>
        )}
      </div>
    </aside>
  );
}
