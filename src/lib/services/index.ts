import type { NotificationService, WeazeNotification, WeazeMetrics } from "./notification-service";
import { MockNotificationService } from "./mock-notification-service";
import { SupabaseNotificationService } from "./supabase-notification-service";

export type { WeazeNotification, WeazeMetrics };

let instance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (instance) return instance;

  // Troque para true ou use import.meta.env.VITE_USE_SUPABASE quando conectar ao Supabase.
  // Exemplo com env var:
  //   const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true";
  const useSupabase = false;

  instance = useSupabase
    ? new SupabaseNotificationService()
    : new MockNotificationService();

  return instance;
}
