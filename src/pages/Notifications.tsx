import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Bell, BellOff, MessageSquare, AtSign, Radio, FileText, Check, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  tenant_id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  priority: "high" | "medium" | "low";
  read_at: string | null;
  data: Record<string, unknown>;
  reference_id: string | null;
  created_at: string;
  actor_profiles?: { name: string; avatar_url: string | null } | null;
};

type NotificationSummary = {
  replies: number;
  mentions: number;
  liveStarted: number;
  newPosts: number;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bgColor: string; priority: number }> = {
  reply_message: { icon: MessageSquare, bgColor: "bg-blue-100", priority: 3 },
  mention: { icon: AtSign, bgColor: "bg-purple-100", priority: 4 },
  live_started: { icon: Radio, bgColor: "bg-red-100", priority: 2 },
  new_post: { icon: FileText, bgColor: "bg-green-100", priority: 1 },
};

export default function Notifications() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<NotificationSummary>({ replies: 0, mentions: 0, liveStarted: 0, newPosts: 0 });

  const loadNotifications = async () => {
    if (!tenant || !user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor_profiles:actor_id(name, avatar_url)")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .order("priority DESC", { foreignTable: "notifications", ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Load notifications error:", error);
      setLoading(false);
      return;
    }

    const notificationsData = (data || []) as unknown as Notification[];
    setNotifications(notificationsData);

    const unread = notificationsData.filter(n => !n.read_at);
    setSummary({
      replies: unread.filter(n => n.type === "reply_message").length,
      mentions: unread.filter(n => n.type === "mention").length,
      liveStarted: unread.filter(n => n.type === "live_started").length,
      newPosts: unread.filter(n => n.type === "new_post").length,
    });

    setLoading(false);
  };

  useEffect(() => {
    if (tenant && user) loadNotifications();
  }, [tenant, user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.id);

      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    }

    const referenceId = notification.reference_id || notification.data?.topic_id || notification.data?.post_id;

    switch (notification.type) {
      case "reply_message":
      case "mention":
        if (referenceId) navigate(`/conversas/${referenceId}`);
        else navigate("/conversas");
        break;
      case "live_started":
        if (referenceId) navigate(`/feed?live=${referenceId}`);
        else navigate("/feed");
        break;
      case "new_post":
        navigate(`/feed?post=${referenceId}`);
        break;
      default:
        navigate("/feed");
    }
  };

  const markAllAsRead = async () => {
    if (!tenant || !user) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .is("read_at", null);

    toast.success("Todas marcadas como lidas");
    loadNotifications();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
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

  const getTypeIcon = (type: string) => {
    const config = TYPE_CONFIG[type];
    if (!config) return Bell;
    return config.icon;
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
      <TopBar title="Notificações" />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground mb-2">Você está em dia com sua comunidade</p>
            <p className="text-sm text-muted-foreground/70">Novas interações aparecerão aqui</p>
          </div>
        ) : (
          <>
            {(summary.replies > 0 || summary.mentions > 0 || summary.liveStarted > 0) && (
              <div className="grid grid-cols-3 gap-2 p-4 border-b bg-gray-50">
                {summary.replies > 0 && (
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold text-blue-600">{summary.replies}</p>
                    <p className="text-xs text-muted-foreground">respostas</p>
                  </div>
                )}
                {summary.mentions > 0 && (
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <AtSign className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-lg font-bold text-purple-600">{summary.mentions}</p>
                    <p className="text-xs text-muted-foreground">menções</p>
                  </div>
                )}
                {summary.liveStarted > 0 && (
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <Radio className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <p className="text-lg font-bold text-red-600">{summary.liveStarted}</p>
                    <p className="text-xs text-muted-foreground">lives</p>
                  </div>
                )}
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const IconComponent = getTypeIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      n.read_at ? "opacity-60" : "bg-white"
                    } ${getPriorityColor(n.priority)}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={n.actor_profiles?.avatar_url || ""} />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                        {n.actor_profiles?.name?.[0]?.toUpperCase() || n.title[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(n.created_at)}
                      </p>
                    </div>

                    {!n.read_at && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}

                    <div className={`p-2 rounded-full ${TYPE_CONFIG[n.type]?.bgColor || "bg-gray-100"}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {notifications.some(n => !n.read_at) && (
        <div className="p-4 border-t border-border bg-white">
          <Button onClick={markAllAsRead} variant="outline" className="w-full">
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}