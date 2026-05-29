import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Eye, Share2, Send, Sparkles, Pin } from "lucide-react";
import { conversations, conversationComments } from "@/lib/mock-data";
import { WButton } from "@/components/weaze/WButton";

export const Route = createFileRoute("/conversas/$id")({
  component: ConversationDetail,
});

function ConversationDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const conv = conversations.find((x) => x.id === id) ?? conversations[0];
  const comments = conversationComments.filter((c) => c.conversationId === conv.id);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const sendReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
          <div className="flex items-center justify-between px-3 h-14">
            <div className="flex items-center gap-2">
              <button
                onClick={() => nav({ to: "/conversas" })}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-sm truncate max-w-[200px]">Conversa</h1>
            </div>
            <div className="flex items-center gap-1">
              <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-[#630091] font-semibold uppercase">
              {conv.pinned && <Pin size={12} />}
              {conv.category}
              {conv.trending && (
                <>
                  <span className="text-foreground/30">·</span>
                  <Sparkles size={12} className="text-amber-500" /> Trending
                </>
              )}
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight leading-snug">
              {conv.title}
            </h1>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{conv.description}</p>

            <div className="mt-3 flex items-center gap-3 text-xs text-foreground/60">
              <span className="h-6 w-6 rounded-full bg-brand-gradient text-white grid place-items-center text-[10px] font-bold">
                {conv.authorAvatar}
              </span>
              <span className="font-semibold text-foreground/80">{conv.author}</span>
              <span>·</span>
              <span>{conv.createdAt}</span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-foreground/60">
              <span className="flex items-center gap-1">
                <Heart size={14} /> {conv.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={14} /> {conv.replies} respostas
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} /> {conv.views} visualizações
              </span>
            </div>

            <div className="mt-3 flex gap-1.5">
              {conv.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient-soft text-[#630091] font-semibold"
                >
                  #{t}
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setLiked((v) => !v)}
                className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                  liked
                    ? "bg-[#d81e62] text-white border-[#d81e62]"
                    : "bg-white border-border text-foreground/70"
                }`}
              >
                <Heart size={16} fill={liked ? "white" : "none"} />{" "}
                {liked ? conv.likes + 1 : conv.likes}
              </button>
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-white border-border border text-foreground/70">
                <MessageSquare size={16} /> Responder
              </button>
            </div>
          </div>

          <div className="px-4 pt-4 pb-20">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">
              {comments.length} {comments.length === 1 ? "resposta" : "respostas"}
            </p>
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white border border-border p-4 shadow-soft"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 h-8 w-8 rounded-full bg-brand-gradient text-white grid place-items-center text-xs font-bold">
                      {c.authorAvatar}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{c.author}</span>
                        <span className="text-[10px] text-foreground/50">{c.createdAt}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">{c.text}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button className="flex items-center gap-1 text-xs text-foreground/50 hover:text-[#d81e62]">
                          <Heart size={12} /> {c.likes}
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                          className="text-xs text-foreground/50 hover:text-[#630091] font-semibold"
                        >
                          Responder
                        </button>
                      </div>

                      {c.replies.length > 0 && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-border space-y-2">
                          {c.replies.map((r, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-semibold">{r.author}</span>
                              <span className="text-foreground/80"> {r.text}</span>
                              <span className="text-[10px] text-foreground/40 ml-2">
                                {r.createdAt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingTo === c.id && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Escreva sua resposta..."
                            className="flex-1 h-9 rounded-full bg-muted px-4 text-sm outline-none"
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (() => {
                                setReplyContent("");
                                setReplyingTo(null);
                              })()
                            }
                          />
                          <button
                            onClick={() => {
                              setReplyContent("");
                              setReplyingTo(null);
                            }}
                            className="h-9 w-9 rounded-full bg-brand-gradient text-white grid place-items-center"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-pb">
          <div className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 h-11 rounded-2xl bg-muted px-4 text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
            />
            <button
              onClick={sendReply}
              className="h-11 w-11 rounded-2xl bg-brand-gradient text-white grid place-items-center shadow-pink"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
