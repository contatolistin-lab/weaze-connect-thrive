import type { NotificationService, WeazeNotification, WeazeMetrics } from "./notification-service";

export class SupabaseNotificationService implements NotificationService {
  getInitialNotifications(): WeazeNotification[] {
    // TODO: buscar do Supabase via RPC ou query
    // Exemplo:
    //   const { data } = await supabase
    //     .from("notifications")
    //     .select("*")
    //     .eq("user_id", userId)
    //     .order("created_at", { ascending: false })
    //     .limit(5);
    //   return data.map(mapToWeazeNotification);
    return [];
  }

  getInitialMetrics(): WeazeMetrics {
    // TODO: buscar do Supabase
    // Exemplo:
    //   const { data } = await supabase
    //     .rpc("get_user_metrics", { user_id: userId });
    //   return data;
    return { likes: 0, comments: 0, shares: 0 };
  }

  generateLike(_userName?: string): WeazeNotification {
    // TODO: persistir no Supabase
    // Exemplo:
    //   await supabase.from("notifications").insert({
    //     kind: "like",
    //     text: `${userName} curtiu sua postagem.`,
    //     user_id: currentUserId,
    //   });
    return {
      id: "notif_" + Date.now(),
      kind: "like",
      text: "curtiu sua postagem.",
      time: "agora",
    };
  }

  generateComment(_userName?: string): WeazeNotification {
    // TODO: persistir no Supabase
    return {
      id: "notif_" + Date.now(),
      kind: "comment",
      text: "comentou na sua postagem.",
      time: "agora",
    };
  }

  generateShare(): WeazeNotification {
    // TODO: persistir no Supabase
    return {
      id: "notif_" + Date.now(),
      kind: "share",
      text: "compartilhou seu post.",
      time: "agora",
    };
  }
}
