import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Bell, BellOff, Circle, Trash2, Star } from "lucide-react";

type Notification = {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  priority: "high" | "medium" | "low";
  read_at: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

export default function Notifications() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");

  const loadNotifications = async () => {
    if (!tenant || !user) return;
    setLoading(true);

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "unread") {
      query = query.is("read_at", null);
    } else if (filter === "high") {
      query = query.eq("priority", "high");
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) { console.error("Load notifications error:", error); return; }
    setNotifications((data || []) as unknown as Notification[]);
  };

  useEffect(() => {
    if (tenant && user) loadNotifications();
  }, [tenant, user, filter]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("tenant_id", tenant?.id)
      .eq("user_id", user?.id)
      .is("read_at", null);
    
    toast.success("Todas marcadas como lidas");
    loadNotifications();
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notificação excluída");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500 bg-red-50";
      case "medium": return "border-l-yellow-500 bg-yellow-50";
      case "low": return "border-l-gray-300";
      default: return "border-l-gray-300";
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center">
          <p className="text-muted-foreground">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      
      {/* Filters */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-3 text-sm font-medium ${filter === "all" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex-1 py-3 text-sm font-medium ${filter === "unread" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Bell className="h-4 w-4 inline mr-1" />
          Não lidas
        </button>
        <button
          onClick={() => setFilter("high")}
          className={`flex-1 py-3 text-sm font-medium ${filter === "high" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Star className="h-4 w-4 inline mr-1" />
          Importantes
        </button>
      </div>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-l-4 ${getPriorityColor(n.priority)} ${
                  n.read_at ? "opacity-60" : ""
                }`}
                onClick={() => !n.read_at && markAsRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  {!n.read_at && (
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500 mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{n.title}</span>
                      {n.priority === "high" && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                          Importante
                        </span>
                      )}
                    </div>
                    {n.body && (
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {notifications.some(n => !n.read_at) && (
        <div className="p-4 border-t border-border">
          <Button onClick={markAllAsRead} variant="outline" className="w-full">
            Marcar todas como lidas
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}