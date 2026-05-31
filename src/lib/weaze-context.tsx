import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getNotificationService,
  type WeazeNotification,
  type WeazeMetrics,
} from "./services";

interface WeazeContextType {
  notifications: WeazeNotification[];
  metrics: WeazeMetrics;
  unreadCount: number;
  addLike: (userName?: string) => void;
  addComment: (userName?: string) => void;
  addShare: () => void;
  markAllRead: () => void;
}

const WeazeContext = createContext<WeazeContextType | null>(null);

const service = getNotificationService();

export function WeazeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WeazeNotification[]>(
    () => service.getInitialNotifications(),
  );
  const [metrics, setMetrics] = useState<WeazeMetrics>(
    () => service.getInitialMetrics(),
  );
  const [unreadCount, setUnreadCount] = useState(notifications.length);

  const addLike = useCallback((userName?: string) => {
    const notif = service.generateLike(userName);
    setNotifications((prev) => [notif, ...prev]);
    setMetrics((prev) => ({ ...prev, likes: prev.likes + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const addComment = useCallback((userName?: string) => {
    const notif = service.generateComment(userName);
    setNotifications((prev) => [notif, ...prev]);
    setMetrics((prev) => ({ ...prev, comments: prev.comments + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const addShare = useCallback(() => {
    const notif = service.generateShare();
    setNotifications((prev) => [notif, ...prev]);
    setMetrics((prev) => ({ ...prev, shares: prev.shares + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const actions = [addLike, addComment, addShare] as const;
    const interval = setInterval(() => {
      const fn = actions[Math.floor(Math.random() * actions.length)];
      fn();
    }, 15000);
    return () => clearInterval(interval);
  }, [addLike, addComment, addShare]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <WeazeContext.Provider
      value={{ notifications, metrics, unreadCount, addLike, addComment, addShare, markAllRead }}
    >
      {children}
    </WeazeContext.Provider>
  );
}

export function useWeaze() {
  const ctx = useContext(WeazeContext);
  if (!ctx) throw new Error("useWeaze must be used within WeazeProvider");
  return ctx;
}
