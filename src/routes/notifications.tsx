import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, UserPlus, Radio, Sparkles } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notificações — WEAZE" }] }),
  component: Notifications,
});

const iconMap = {
  like: { I: Heart, color: "#d81e62" },
  comment: { I: MessageCircle, color: "#630091" },
  follow: { I: UserPlus, color: "#d81e62" },
  brand: { I: Sparkles, color: "#630091" },
  live: { I: Radio, color: "#d81e62" },
} as const;

function Notifications() {
  return (
    <AppShell title="Notificações">
      <div className="px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {["Tudo", "Curtidas", "Comentários", "Marcas", "Lives"].map((t, i) => (
            <button
              key={t}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold ${i === 0 ? "bg-brand-gradient text-white" : "bg-muted text-foreground/70"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mt-2 mb-2">
          Hoje
        </p>
        <ul className="space-y-2">
          {notifications.map((n) => {
            const { I, color } = iconMap[n.kind];
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
