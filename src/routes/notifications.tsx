import { createFileRoute } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Radio,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { useWeaze } from "@/lib/weaze-context";

const iconMap: Record<string, { I: LucideIcon; color: string }> = {
  like: { I: Heart, color: "#d81e62" },
  comment: { I: MessageCircle, color: "#630091" },
  share: { I: Share2, color: "#d81e62" },
  follow: { I: UserPlus, color: "#d81e62" },
  brand: { I: Sparkles, color: "#630091" },
  live: { I: Radio, color: "#d81e62" },
};

function Notifications() {
  const { notifications } = useWeaze();
  return (
    <AppShell title="Notificações">
      <div className="px-4 pt-3">
        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mt-2 mb-2">
          Hoje
        </p>
        {notifications.length === 0 && (
          <p className="text-sm text-foreground/50 text-center py-10">Nenhuma notificação ainda.</p>
        )}
        <ul className="space-y-2">
          {notifications.map((n) => {
            const entry = iconMap[n.kind] || iconMap.like;
            const I = entry.I;
            const color = entry.color;
            return (
              <li
                key={n.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border shadow-soft"
              >
                <span
                  className="h-10 w-10 rounded-full bg-brand-gradient-soft grid place-items-center"
                  style={{ color }}
                >
                  <I size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-[11px] text-foreground/50">{n.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
