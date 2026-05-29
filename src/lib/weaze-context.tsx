import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface WeazeNotification {
  id: string;
  kind: "like" | "comment" | "share" | "follow" | "brand" | "live";
  text: string;
  time: string;
}

export interface WeazeMetrics {
  likes: number;
  comments: number;
  shares: number;
}

interface WeazeContextType {
  notifications: WeazeNotification[];
  metrics: WeazeMetrics;
  unreadCount: number;
  addLike: (userName: string) => void;
  addComment: (userName: string) => void;
  addShare: () => void;
  markAllRead: () => void;
}

const names = [
  "Ana Beatriz",
  "Rafael Costa",
  "Júlia Lima",
  "Pedro Santos",
  "Carla Dias",
  "Lucas Oliveira",
  "Fernanda Souza",
  "Marcos Paulo",
];

function pickName() {
  return names[Math.floor(Math.random() * names.length)];
}

const WeazeContext = createContext<WeazeContextType | null>(null);

export function WeazeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WeazeNotification[]>([
    { id: "n1", kind: "share", text: "Seu post foi compartilhado 12 vezes hoje.", time: "agora" },
    { id: "n2", kind: "like", text: "Ana e mais 42 pessoas curtiram seu post.", time: "5m" },
    { id: "n3", kind: "comment", text: "Pedro comentou: 'Massa demais!'", time: "12m" },
  ]);

  const [metrics, setMetrics] = useState<WeazeMetrics>({
    likes: 84720,
    comments: 12340,
    shares: 456,
  });
  const [unreadCount, setUnreadCount] = useState(3);

  const addLike = useCallback((userName?: string) => {
    const name = userName || pickName();
    const id = "notif_" + Date.now();
    setNotifications((prev) => [
      { id, kind: "like", text: `${name} curtiu sua postagem.`, time: "agora" },
      ...prev,
    ]);
    setMetrics((prev) => ({ ...prev, likes: prev.likes + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const addComment = useCallback((userName?: string) => {
    const name = userName || pickName();
    const id = "notif_" + Date.now();
    setNotifications((prev) => [
      { id, kind: "comment", text: `${name} comentou na sua postagem.`, time: "agora" },
      ...prev,
    ]);
    setMetrics((prev) => ({ ...prev, comments: prev.comments + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const addShare = useCallback(() => {
    const name = pickName();
    const id = "notif_" + Date.now();
    setNotifications((prev) => [
      { id, kind: "share", text: `${name} compartilhou seu post.`, time: "agora" },
      ...prev,
    ]);
    setMetrics((prev) => ({ ...prev, shares: prev.shares + 1 }));
    setUnreadCount((prev) => prev + 1);
  }, []);

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
