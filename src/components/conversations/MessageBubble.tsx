import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Reply, Pencil, Trash2, Pin, Copy, X, Check } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { ConversationMessage } from "@/lib/conversations";

type Props = {
  message: ConversationMessage;
  isOwn: boolean;
  canModerate: boolean;
  canPin: boolean;
  canUnpin: boolean;
  isPinned: boolean;
  onReply: (msg: ConversationMessage) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  onCopy: (content: string) => void;
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

export default function MessageBubble({
  message,
  isOwn,
  canModerate,
  canPin,
  canUnpin,
  isPinned,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onCopy,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setEditing(false);
  };

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex gap-2.5 px-4 py-1.5 hover:bg-gray-50/50 rounded-xl transition-colors ${
        isPinned ? "bg-gradient-to-r from-[#630091]/3 to-[#d81e62]/3 border border-[#630091]/10 rounded-xl" : ""
      }`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={message.profiles?.avatar_url || ""} />
        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
          {message.profiles?.name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-gray-800">
            {message.profiles?.name || "Usuário"}
          </span>
          {isPinned && (
            <span className="text-[10px] text-[#630091] bg-[#630091]/10 px-1.5 py-0.5 rounded-full font-medium">
              fixada
            </span>
          )}
          <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
          {message.updated_at !== message.created_at && !editing && (
            <span className="text-[10px] text-gray-300">(editado)</span>
          )}
        </div>

        {message.reply_preview && (
          <div className="mb-1 ml-2 pl-2 border-l-2 border-gray-200">
            <span className="text-[11px] text-gray-500">
              @{message.reply_preview.profiles?.name || "usuário"}:{" "}
            </span>
            <span className="text-[11px] text-gray-400 italic">
              {message.reply_preview.content?.slice(0, 60)}
              {message.reply_preview.content && message.reply_preview.content.length > 60 ? "..." : ""}
            </span>
          </div>
        )}

        {editing ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-2 text-[11px] text-purple-600">
              <Pencil className="h-3 w-3" />
              <span>Editando mensagem</span>
            </div>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] text-sm resize-none border-gray-200"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                if (e.key === "Escape") { setEditing(false); setEditContent(message.content); }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-gray-400">Enter para salvar, Esc para cancelar</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(message.content); }} className="h-7 text-xs">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()} className="h-7 text-xs bg-[#630091] hover:bg-[#630091]/90">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!editing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] text-gray-400 hover:text-purple-600 gap-1 px-2"
                onClick={() => onReply(message)}
              >
                <Reply className="h-3 w-3" />
                Responder
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem onClick={handleCopy} className="text-xs gap-2">
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </DropdownMenuItem>

                  {(canModerate || canPin) && !isPinned && (
                    <DropdownMenuItem onClick={() => onPin(message.id)} className="text-xs gap-2">
                      <Pin className="h-3 w-3" />
                      Fixar mensagem
                    </DropdownMenuItem>
                  )}

                  {(canModerate || canUnpin) && isPinned && (
                    <DropdownMenuItem onClick={() => onUnpin(message.id)} className="text-xs gap-2">
                      <Pin className="h-3 w-3" />
                      Remover fixação
                    </DropdownMenuItem>
                  )}

                  {isOwn && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditing(true)} className="text-xs gap-2">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </DropdownMenuItem>
                    </>
                  )}

                  {(isOwn || canModerate) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-xs gap-2 text-red-500 focus:text-red-500">
                        <Trash2 className="h-3 w-3" />
                        Remover
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
