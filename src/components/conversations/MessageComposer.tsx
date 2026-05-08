import { useState, useRef, useEffect } from "react";
import { Send, X, AtSign } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ReplyPreview = { id: string; name: string; content: string };

type Props = {
  onSend: (content: string, replyTo?: string | null) => void;
  isSending: boolean;
  placeholder?: string;
  replyPreview?: ReplyPreview | null;
  onCancelReply: () => void;
  mentionUsers?: Array<{ id: string; name: string; avatar_url?: string }>;
  onMentionSelect?: (name: string) => void;
  maxLength?: number;
};

export default function MessageComposer({
  onSend,
  isSending,
  placeholder = "Escreva sua mensagem... (@ para mencionar)",
  replyPreview,
  onCancelReply,
  mentionUsers = [],
  onMentionSelect,
  maxLength = 2000,
}: Props) {
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMentions = mentionUsers.filter((u) =>
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  useEffect(() => {
    const lastAt = text.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = text.slice(lastAt + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionSearch(afterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed, replyPreview?.id ?? null);
    setText("");
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleMentionSelect = (name: string) => {
    const lastAt = text.lastIndexOf("@");
    const newText = text.slice(0, lastAt) + "@" + name + " ";
    setText(newText);
    setShowMentions(false);
    onMentionSelect?.(name);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {replyPreview && (
          <div className="mb-2 flex items-start gap-2 bg-[#630091]/5 border border-[#630091]/10 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium text-[#630091]">Respondendo a @{replyPreview.name}</span>
              <p className="text-xs text-gray-500 truncate">{replyPreview.content}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={onCancelReply}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {showMentions && filteredMentions.length > 0 && (
          <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
            {filteredMentions.map((u) => (
              <button
                key={u.id}
                onClick={() => handleMentionSelect(u.name)}
                className="w-full text-left px-3 py-2 hover:bg-[#630091]/5 transition-colors flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback className="text-[10px] bg-gray-100">
                    {u.name[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">@{u.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className="min-h-[48px] max-h-40 resize-none pr-10 text-sm border-gray-200 rounded-xl focus:border-[#630091]/30 focus:ring-[#630091]/10"
              rows={1}
            />
            <AtSign className="absolute right-3 bottom-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#630091] to-[#d81e62] hover:opacity-90 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {text.length > maxLength * 0.8 && (
          <p className="text-[11px] text-gray-400 mt-1 text-right">
            {text.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
