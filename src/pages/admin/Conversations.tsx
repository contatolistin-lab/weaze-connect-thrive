import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Hash, Lock, Users, Pencil, Trash2, Archive, MessageSquare } from "lucide-react";
import type { ConversationVisibility } from "@/lib/conversations";

type Conversation = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  visibility: ConversationVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  member_count?: number;
};

export default function AdminConversations() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVis, setNewVis] = useState<ConversationVisibility>("public");
  const [creating, setCreating] = useState(false);

  const loadConversations = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*, conversation_members(user_id)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setConversations((data as any[])?.map((c) => ({
      ...c,
      member_count: c.conversation_members?.length ?? 0,
    })) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadConversations(); }, [tenant?.id]);

  const handleCreate = async () => {
    if (!tenant || !user || !newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ tenant_id: tenant.id, title: newTitle, description: newDesc || null, visibility: newVis, created_by: user.id })
      .select()
      .single();
    if (!error && data) {
      setConversations([{ ...data, member_count: 1 }, ...conversations]);
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewVis("public");
      toast.success(`Conversa "${newTitle}" criada`);
      await supabase.from("conversation_members").insert({ conversation_id: data.id, user_id: user.id, role: "owner", added_by: user.id });
    } else {
      toast.error(error?.message || "Erro ao criar conversa");
    }
    setCreating(false);
  };

  const handleArchive = async (id: string) => {
    await supabase.from("conversations").update({ archived: true }).eq("id", id);
    setConversations(conversations.filter((c) => c.id !== id));
    toast.success("Conversa arquivada");
  };

  const visibilityConfig = {
    public: { label: "Pública", color: "bg-green-50 text-green-700 border-green-200" },
    private: { label: "Privada", color: "bg-amber-50 text-amber-700 border-amber-200" },
    internal: { label: "Interna", color: "bg-purple-50 text-purple-700 border-purple-200" },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Gerenciar Conversas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e modere conversas segmentadas da comunidade.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-[#630091] hover:bg-[#630091]/90">
          <Plus className="h-4 w-4" />
          Nova conversa
        </Button>
      </div>

      <div className="grid gap-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma conversa criada ainda.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const vc = visibilityConfig[conv.visibility] || visibilityConfig.public;
            return (
              <Card key={conv.id} className="hover:border-[#630091]/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#630091]/10 to-[#d81e62]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Hash className="h-4 w-4 text-[#630091]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{conv.title}</h3>
                        <Badge className={`text-[10px] border ${vc.color}`}>{vc.label}</Badge>
                      </div>
                      {conv.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{conv.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>{conv.member_count ?? 0} membros</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          Atualizada {new Date(conv.updated_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-[#630091]">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleArchive(conv.id)}>
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
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
                  const vc = visibilityConfig[v];
                  return (
                    <button
                      key={v}
                      onClick={() => setNewVis(v)}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        newVis === v ? "border-[#630091] bg-[#630091]/5" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <p className={`text-xs font-medium ${newVis === v ? "text-[#630091]" : "text-gray-700"}`}>{vc.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating} className="w-full bg-[#630091] hover:bg-[#630091]/90">
              {creating ? "Criando..." : "Criar conversa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
