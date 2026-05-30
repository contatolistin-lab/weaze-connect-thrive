import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Globe, Plus } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { groups, groupTopics } from "@/lib/mock-data";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Grupos — WEAZE" }] }),
  component: Groups,
});

function Groups() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<"todos" | "publicos" | "privados">("todos");

  const filtered = groups.filter((g) => {
    if (filter === "publicos") return g.privacy === "public";
    if (filter === "privados") return g.privacy === "private";
    return true;
  });

  return (
    <AppShell title="Grupos">
      <div className="px-4 pt-3 space-y-3">
        <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">Seus grupos</p>
          <h2 className="mt-1 text-2xl font-extrabold">{groups.length} ativos</h2>
          <p className="text-sm opacity-90">{groupTopics.length} tópicos em discussão</p>
          <div className="mt-3">
            <WButton variant="white" size="sm">
              <Plus size={14} /> Criar grupo
            </WButton>
          </div>
        </div>

        <div className="flex gap-2">
          {(["todos", "publicos", "privados"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 h-9 rounded-full text-sm font-semibold ${
                filter === t ? "bg-brand-gradient text-white" : "bg-muted"
              }`}
            >
              {t === "todos" ? "Todos" : t === "publicos" ? "Públicos" : "Privados"}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="w-full space-y-2">
            {filtered.map((g) => {
              const topics = groupTopics.filter((t) => t.groupId === g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => nav({ to: "/groups/$id", params: { id: g.id } })}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border bg-white border-border shadow-soft"
                >
                  <span className="text-2xl shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      {g.name}
                      {g.privacy === "private" ? (
                        <Lock size={12} className="text-foreground/50" />
                      ) : (
                        <Globe size={12} className="text-foreground/50" />
                      )}
                    </p>
                    <p className="text-[11px] text-foreground/60">
                      {g.topic} · {g.members} membros · {topics.length} tópicos
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#d81e62]">Abrir</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
