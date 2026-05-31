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

export interface NotificationService {
  getInitialNotifications(): WeazeNotification[];
  getInitialMetrics(): WeazeMetrics;
  generateLike(userName?: string): WeazeNotification;
  generateComment(userName?: string): WeazeNotification;
  generateShare(): WeazeNotification;
}
