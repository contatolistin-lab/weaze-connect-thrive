import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

interface ReplyBoxProps {
  onSubmit: (content: string) => Promise<void>;
  replyToName?: string;
  onCancelReply?: () => void;
}

export default function ReplyBox({ onSubmit, replyToName, onCancelReply }: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {replyToName && (
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
          <span className="text-muted-foreground">Respondendo a <strong>{replyToName}</strong></span>
          {onCancelReply && (
            <button onClick={onCancelReply} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua resposta..."
          className="min-h-[60px] resize-none"
          maxLength={2000}
        />
        <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="h-auto">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}