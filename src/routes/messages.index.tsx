import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Edit3 } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { Avatar } from "@/components/weaze/Avatar";
import { chats } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/messages/")({
  head: () => ({ meta: [{ title: "Mensagens — WEAZE" }] }),
  component: Messages,
});

function Messages() {
  const [q, setQ] = useState("");
  const list = chats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <AppShell title="Mensagens">
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-11">
          <Search size={18} className="text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conversas"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button className="h-8 w-8 rounded-full bg-white text-[#000000] grid place-items-center shadow-brand">
            <Edit3 size={14} />
          </button>
        </div>

        <div className="mt-4 -mx-4">
          <div className="px-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {chats.map((c) => (
              <div key={c.id} className="flex flex-col items-center w-16 shrink-0">
                <Avatar name={c.name} size={56} ring={c.unread > 0} brand={c.brand} />
                <p className="text-[11px] mt-1 truncate w-full text-center">
                  {c.name.split(" ")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-2 divide-y divide-border">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                to="/messages/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 py-3"
              >
                <Avatar name={c.name} size={48} brand={c.brand} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate">{c.name}</p>
                    <span className="text-[11px] text-foreground/50">{c.time}</span>
                  </div>
                  <p className="text-xs text-foreground/60 truncate">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-brand-gradient text-white text-[10px] font-bold grid place-items-center">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
