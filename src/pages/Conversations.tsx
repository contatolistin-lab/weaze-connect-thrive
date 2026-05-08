import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MessageCircle, Plus, Lock, Users, Hash,
  Send, Pin, Trash2, AtSign, X, ArrowLeft
} from "lucide-react";
import { useConversations, useConversation } from "@/hooks/useConversations";
import type { ConversationVisibility } from "@/lib/conversations";

type Tab = "public" | "private" | "internal";

function formatTime(dateStr: string | null | undefined): string {
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

const tabConfig = {
  public: { label: "Públicas", icon: Hash, color: "text-green-600" },
  private: { label: "Privadas", icon: Lock, color: "text-amber-600" },
  internal: { label: "Internas", icon: Users, color: "text-purple-600" },
};

export default function ConversationsPage() {
  const { tenant, isOwner } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("public");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVis, setNewVis] = useState<ConversationVisibility>("public");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { conversations, isLoading: convLoading, createConversation, isCreating, createError, error: convError, refetch } = useConversations(tenant?.id ?? "", user?.id ?? "");
  
  console.log("[ConversationsPage] Context check - tenant:", tenant?.id, "user:", user?.id, "tenantExists:", !!tenant);
  
  const {
    messages, pinned, members, myRole, isLoadingMessages,
    sendMessage, updateMessage, deleteMessage,
    pinMessage, isPinning, unpinMessage,
  } = useConversation(selectedConvId, user?.id ?? "");

  const filtered = conversations.filter((c) => c.visibility === activeTab);
  console.log("[Conversations] Render:", {
    tenantId: tenant?.id,
    userId: user?.id,
    convCount: conversations.length,
    filteredCount: filtered.length,
    activeTab,
    selectedConvId,
    isLoading: convLoading,
  });

  useEffect(() => {
    const convId = searchParams.get("conv");
    if (convId) {
      console.log("[Conversations] Opening conversation from URL:", convId);
      setSelectedConvId(convId);
    }
  }, [searchParams]);

  // Show error toast when creation fails
  useEffect(() => {
    if (createError) {
      console.error("[Conversations] Creation error:", createError);
      toast.error(`Erro ao criar conversa: ${createError.message}`);
    }
  }, [createError]);

  // Show success toast when conversations change (creation succeeded)
  const [prevConvCount, setPrevConvCount] = useState(conversations.length);
  useEffect(() => {
    if (conversations.length > prevConvCount && prevConvCount >= 0) {
      toast.success("Conversa criada com sucesso!");
    }
    setPrevConvCount(conversations.length);
  }, [conversations.length, prevConvCount]);

  const handleCreate = async () => {
    if (!tenant || !user || !newTitle.trim()) {
      console.warn("[handleCreate] Missing required fields");
      return;
    }

    if (submitting) {
      console.warn("[handleCreate] Already submitting");
      return;
    }

    const title = newTitle.trim();
    const existingConv = conversations.find(
      (c) => c.title.trim().toLowerCase() === title.toLowerCase()
    );
    if (existingConv) {
      toast.error("Já existe uma conversa com esse nome");
      return;
    }

    console.log("[handleCreate] Creating conversation:", title, newVis, "tenant:", tenant.id, "user:", user.id, "timestamp:", Date.now());
    setSubmitting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        createConversation(
          { title, description: newDesc, visibility: newVis },
          {
            onSuccess: () => {
              console.log("[handleCreate] Success callback at", Date.now());
              resolve();
            },
            onError: (err) => {
              console.error("[handleCreate] Error callback:", err);
              reject(err);
            },
          }
        );
      });
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewVis("public");
    } catch (err) {
      console.error("[handleCreate] Failed:", err);
      toast.error(`Erro ao criar conversa: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = () => {
    if (!replyText.trim() || !selectedConvId || !user) {
      console.warn("[handleSend] Missing required fields");
      return;
    }
    console.log("[handleSend] Sending message to", selectedConvId);
    sendMessage({ content: replyText.trim(), replyTo: replyingTo?.id ?? null });
    setReplyText("");
    setReplyingTo(null);
  };

  const handleEdit = () => {
    if (!editingId || !editText.trim()) return;
    updateMessage({ messageId: editingId, content: editText.trim() });
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMessage(deletingId);
    setDeletingId(null);
    toast.success("Mensagem removida");
  };

  const handlePin = (msgId: string) => {
    pinMessage(msgId);
    toast.success("Mensagem fixada");
  };

  const handleMention = (name: string) => {
    const lastAt = replyText.lastIndexOf("@");
    setReplyText(replyText.slice(0, lastAt) + "@" + name + " ");
    setShowMention(false);
  };

  useEffect(() => {
    const lastAt = replyText.lastIndexOf("@");
    if (lastAt !== -1) {
      const after = replyText.slice(lastAt + 1);
      if (!after.includes(" ")) {
        const users = members
          .filter((m) => m.profiles?.name?.toLowerCase().includes(after.toLowerCase()))
          .slice(0, 5)
          .map((m) => m.profiles)
          .filter(Boolean);
        setMentionUsers(users);
        setShowMention(true);
      } else setShowMention(false);
    } else setShowMention(false);
  }, [replyText, members]);

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const canMod = myRole === "owner" || myRole === "moderator";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <TopBar />

      {!selectedConvId ? (
        <>
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-2xl mx-auto px-4 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Comunicação da comunidade</p>
                </div>
                {(isB2B || isOwner) && (
                  <Button
                    size="sm"
                    onClick={() => setShowCreate(true)}
                    className="gap-1.5 bg-gradient-to-r from-[#630091] to-[#d81e62] hover:opacity-90 text-white h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs">Nova</span>
                  </Button>
                )}
              </div>

              <div className="flex gap-1 pb-3 overflow-x-auto scrollbar-hide">
                {(["public", "private", "internal"] as Tab[]).map((tab) => {
                  const cfg = tabConfig[tab];
                  const Icon = cfg.icon;
                  const count = conversations.filter((c) => c.visibility === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-[#630091] to-[#d81e62] text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                      {count > 0 && (
                        <span className={`text-[10px px-1.5 py-0.5 rounded-full ${
                          activeTab === tab ? "bg-white/20" : "bg-gray-200"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <main className="flex-1 pb-20">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <AnimatePresence mode="wait">
                {convLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    ))}
                  </motion.div>
                ) : convError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <p className="text-sm font-medium text-red-500 mb-2">Erro ao carregar conversas</p>
                    <p className="text-xs text-gray-400 mb-4">{String(convError)}</p>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
                  </motion.div>
                ) : filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <MessageCircle className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Nenhuma conversa {tabConfig[activeTab].label.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isB2B ? "Crie uma nova conversa" : "Em breve novas conversas"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {filtered.map((conv) => {
                      const visCfg = tabConfig[conv.visibility];
                      const VisIcon = visCfg.icon;
                      return (
                        <motion.div
                          key={conv.id}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => { console.log("[Conversations] Selected conv:", conv.id, conv.title); setSelectedConvId(conv.id); }}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#630091]/20 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              activeTab === "public" ? "bg-green-50" :
                              activeTab === "private" ? "bg-amber-50" : "bg-purple-50"
                            }`}>
                              <VisIcon className={`h-5 w-5 ${visCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 truncate">{conv.title}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                  {formatTime(conv.updated_at)}
                                </span>
                              </div>
                              {conv.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{conv.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${visCfg.color} border-current/20`}>
                                  <VisIcon className="h-2.5 w-2.5 mr-0.5" />
                                  {visCfg.label}
                                </Badge>
                                {conv.my_role && conv.my_role !== "member" && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-[#630091]/30 text-[#630091]">
                                    {conv.my_role === "owner" ? "responsável" : "mod"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </>
      ) : (
        <>
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedConvId(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">{selectedConv?.title}</h2>
                {selectedConv?.description && (
                  <p className="text-xs text-gray-400 truncate">{selectedConv.description}</p>
                )}
              </div>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${tabConfig[selectedConv?.visibility ?? "public"].color}`}>
                {tabConfig[selectedConv?.visibility ?? "public"].label}
              </Badge>
            </div>
          </div>

          <main className="flex-1 pb-20">
            <div className="max-w-2xl mx-auto">
              {pinned.length > 0 && (
                <div className="bg-gradient-to-r from-[#630091]/5 to-[#d81e62]/5 border-b border-[#630091]/10">
                  <div className="max-w-2xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="h-3 w-3 text-[#630091]" />
                      <span className="text-[10px] font-semibold text-[#630091] uppercase tracking-wider">
                        Fixadas ({pinned.length}/3)
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {pinned.map((msg) => (
                        <div key={msg.id} className="flex-shrink-0 w-48 bg-white rounded-xl border border-[#630091]/10 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={msg.profiles?.avatar_url || ""} />
                              <AvatarFallback className="text-[9px]">{msg.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-medium text-gray-700 truncate">{msg.profiles?.name || "Usuário"}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{msg.content}</p>
                          {canMod && (
                            <button
                              onClick={() => { unpinMessage(msg.id); toast.success("Fixação removida"); }}
                              className="text-[10px] text-gray-400 hover:text-red-500 mt-1"
                            >
                              Desfixar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="px-4 py-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                          <div className="h-10 bg-gray-100 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-300">Seja o primeiro a participar!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} data-msg-id={msg.id} className="group">
                      <div className="flex gap-2.5">
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                          <AvatarImage src={msg.profiles?.avatar_url || ""} />
                          <AvatarFallback className="text-xs bg-gray-100">{msg.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-800">{msg.profiles?.name || "Usuário"}</span>
                            {msg.pinned && <Pin className="h-3 w-3 text-[#630091]" />}
                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                          </div>
                          {msg.reply_preview && (
                            <div className="mb-1 pl-2 border-l-2 border-gray-200">
                              <span className="text-[10px] text-gray-500">@{msg.reply_preview.profiles?.name}: </span>
                              <span className="text-[10px] text-gray-400 italic">{msg.reply_preview.content?.slice(0, 50)}…</span>
                            </div>
                          )}
                          {editingId === msg.id ? (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[60px] text-sm resize-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2 mt-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancelar</Button>
                                <Button size="sm" onClick={handleEdit} className="h-7 text-xs bg-[#630091] hover:bg-[#630091]/90">Salvar</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="text-[10px] text-gray-400 hover:text-purple-600 px-1.5 py-1 rounded hover:bg-purple-50"
                            >
                              Responder
                            </button>
                            {(msg.user_id === user?.id || canMod) && (
                              <button
                                onClick={() => { setEditingId(msg.id); setEditText(msg.content); }}
                                className="text-[10px] text-gray-400 hover:text-purple-600 px-1.5 py-1 rounded hover:bg-purple-50"
                              >
                                Editar
                              </button>
                            )}
                            {(msg.user_id === user?.id || canMod) && (
                              <button
                                onClick={() => setDeletingId(msg.id)}
                                className="text-[10px] text-gray-400 hover:text-red-500 px-1.5 py-1 rounded hover:bg-red-50"
                              >
                                Remover
                              </button>
                            )}
                            {canMod && !msg.pinned && (
                              <button
                                onClick={() => handlePin(msg.id)}
                                className="text-[10px] text-gray-400 hover:text-[#630091] px-1.5 py-1 rounded hover:bg-[#630091]/5"
                              >
                                Fixar
                              </button>
                            )}
                            {canMod && msg.pinned && (
                              <button
                                onClick={() => { unpinMessage(msg.id); toast.success("Fixação removida"); }}
                                className="text-[10px] text-gray-400 hover:text-red-500 px-1.5 py-1 rounded hover:bg-red-50"
                              >
                                Desfixar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>

          <div className="fixed bottom-16 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-100 p-3">
            <div className="max-w-2xl mx-auto">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <MessageCircle className="h-3 w-3 text-[#630091]" />
                  <span className="text-[11px] text-[#630091] font-medium">
                    Respondendo a @{replyingTo.profiles?.name || "usuário"}
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {showMention && mentionUsers.length > 0 && (
                <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {mentionUsers.map((u) => (
                    <button
                      key={u.user_id || u.id}
                      onClick={() => handleMention(u.name)}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 text-sm"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="text-[9px]">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-700">@{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva um comentário... (@ para mencionar)"
                    className="w-full min-h-[44px] max-h-32 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#630091]/30"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !showMention) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <AtSign className="absolute right-3 bottom-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!replyText.trim()}
                  className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#630091] to-[#d81e62] hover:opacity-90 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Geral, Marketing, VIP..." maxLength={60} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição</label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Sobre o que é essa conversa?" maxLength={200} rows={2} className="resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Visibilidade</label>
              <div className="grid grid-cols-3 gap-2">
                {(["public", "private", "internal"] as ConversationVisibility[]).map((v) => {
                  const cfg = tabConfig[v];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={v}
                      onClick={() => setNewVis(v)}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        newVis === v ? "border-[#630091] bg-[#630091]/5" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${newVis === v ? "text-[#630091]" : "text-gray-400"}`} />
                      <p className={`text-xs font-medium ${newVis === v ? "text-[#630091]" : "text-gray-600"}`}>{cfg.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || isCreating || submitting}
              className={`w-full bg-gradient-to-r from-[#630091] to-[#d81e62] hover:opacity-90 ${submitting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isCreating || submitting ? "Criando..." : "Criar conversa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remover mensagem
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">Tem certeza? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Remover</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
