import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Video, Play, Square, Calendar, ExternalLink, Trash2 } from "lucide-react";

type Live = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  external_url: string;
  scheduled_at: string | null;
  is_live: boolean;
  created_at: string;
  post_id: string | null;
};

export default function Lives() {
  const { tenant, canManage } = useTenant();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  const loadLives = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lives")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { console.error("Load lives error:", error); return; }
    setLives(data || []);
  };

  useEffect(() => {
    if (tenant) loadLives();
  }, [tenant]);

  const createLive = async () => {
    if (!tenant || !title.trim() || !url.trim()) {
      toast.error("Título e URL são obrigatórios"); return;
    }
    setCreating(true);
    
    const { data: live, error } = await supabase
      .from("lives")
      .insert({
        tenant_id: tenant.id,
        title: title.trim(),
        description: description.trim() || null,
        external_url: url.trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      .select()
      .single();
    
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    
    toast.success("Live criada!");
    setShowCreate(false);
    setTitle(""); setDescription(""); setUrl(""); setScheduledAt("");
    loadLives();
  };

  const toggleLive = async (live: Live, start: boolean) => {
    const { error } = await supabase
      .from("lives")
      .update({ is_live: start })
      .eq("id", live.id);
    
    if (error) { toast.error(error.message); return; }
    toast.success(start ? "Live iniciada!" : "Live encerrada!");
    loadLives();
  };

  const deleteLive = async (id: string) => {
    if (!confirm("Excluir live?")) return;
    const { error } = await supabase.from("lives").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Live excluída");
    loadLives();
  };

  if (!tenant || !canManage) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-4">
          <p className="text-muted-foreground text-center">
            Você não tem permissão para gerenciar lives.
          </p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl mb-1">Lives</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas transmissões ao vivo</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="bg-brand text-primary-foreground">
            <Video className="h-4 w-4 mr-2" /> Nova Live
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : lives.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma live criada ainda</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4" variant="outline">
              Criar primeira live
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lives.map((live) => (
              <div key={live.id} className="bg-card border border-border p-4 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{live.title}</h3>
                      {live.is_live && (
                        <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          AO VIVO
                        </span>
                      )}
                    </div>
                    {live.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{live.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {live.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(live.scheduled_at).toLocaleString("pt-BR")}
                        </span>
                      )}
                      {live.external_url && (
                        <a href={live.external_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-brand hover:underline">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  {live.is_live ? (
                    <Button onClick={() => toggleLive(live, false)} variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                      <Square className="h-4 w-4 mr-2" /> Encerrar
                    </Button>
                  ) : (
                    <Button onClick={() => toggleLive(live, true)} variant="outline" size="sm" className="flex-1 text-green-600 border-green-200 hover:bg-green-50">
                      <Play className="h-4 w-4 mr-2" /> Iniciar
                    </Button>
                  )}
                  <Button onClick={() => deleteLive(live.id)} variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova live</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título da live *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da transmissão" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" rows={3} />
            </div>
            <div>
              <Label>Link da live (YouTube, Meet, etc) *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Agendar (opcional)</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <Button onClick={createLive} disabled={creating || !title.trim() || !url.trim()} className="w-full bg-brand text-primary-foreground">
              {creating ? "Criando..." : "Criar live"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}