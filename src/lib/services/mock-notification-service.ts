import type { NotificationService, WeazeNotification, WeazeMetrics } from "./notification-service";

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

export class MockNotificationService implements NotificationService {
  getInitialNotifications(): WeazeNotification[] {
    return [
      { id: "n1", kind: "share", text: "Júlia Lima compartilhou seu post.", time: "agora" },
      { id: "n2", kind: "comment", text: "Você comentou na sua postagem.", time: "agora" },
      { id: "n3", kind: "share", text: "Seu post foi compartilhado 12 vezes hoje.", time: "agora" },
      { id: "n4", kind: "like", text: "Ana e mais 42 pessoas curtiram seu post.", time: "5m" },
      { id: "n5", kind: "comment", text: "Pedro comentou: 'Massa demais!'", time: "12m" },
    ];
  }

  getInitialMetrics(): WeazeMetrics {
    return { likes: 84720, comments: 12340, shares: 456 };
  }

  generateLike(userName?: string): WeazeNotification {
    return {
      id: "notif_" + Date.now(),
      kind: "like",
      text: `${userName || pickName()} curtiu sua postagem.`,
      time: "agora",
    };
  }

  generateComment(userName?: string): WeazeNotification {
    return {
      id: "notif_" + Date.now(),
      kind: "comment",
      text: `${userName || pickName()} comentou na sua postagem.`,
      time: "agora",
    };
  }

  generateShare(): WeazeNotification {
    return {
      id: "notif_" + Date.now(),
      kind: "share",
      text: `${pickName()} compartilhou seu post.`,
      time: "agora",
    };
  }
}
