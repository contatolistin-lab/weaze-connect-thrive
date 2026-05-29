import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Globe, Plus, MessageSquare, Heart } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { groups, groupTopics } from "@/lib/mock-data";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Grupos — WEAZE" }] }),
  component: Groups,
});

function Groups() {
  const [filter, setFilter] = useState<"todos" | "publicos" | "privados">("todos");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredGroups = groups.filter((g) => {
    if (filter === "publicos") return g.privacy === "public";
    if (filter === "privados") return g.privacy === "private";
    return true;
  });

  const activeGroup = groups.find((g) => g.id === selectedGroup);
  const activeTopics = activeGroup ? groupTopics.filter((t) => t.groupId === activeGroup.id) : [];

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
            {filteredGroups.map((g) => {
              const isActive = selectedGroup === g.id;
              const topics = groupTopics.filter((t) => t.groupId === g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(isActive ? null : g.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-brand-gradient text-white border-transparent shadow-brand"
                      : "bg-white border-border shadow-soft"
                  }`}
                >
                  <span className="text-2xl shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      {g.name}
                      {g.privacy === "private" ? (
                        <Lock
                          size={12}
                          className={isActive ? "text-white/70" : "text-foreground/50"}
                        />
                      ) : (
                        <Globe
                          size={12}
                          className={isActive ? "text-white/70" : "text-foreground/50"}
                        />
                      )}
                    </p>
                    <p
                      className={`text-[11px] ${isActive ? "text-white/80" : "text-foreground/60"}`}
                    >
                      {g.topic} · {g.members} membros · {topics.length} tópicos
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold ${isActive ? "text-white" : "text-[#d81e62]"}`}
                  >
                    {isActive ? "Aberto" : "Abrir"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedGroup && activeGroup && (
          <div className="pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                Tópicos do grupo
              </p>
              <button className="text-xs font-semibold text-[#d81e62] flex items-center gap-1">
                <Plus size={12} /> Novo tópico
              </button>
            </div>
            <div className="space-y-2">
              {activeTopics.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl bg-white border border-border p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{t.title}</p>
                      <p className="text-xs text-foreground/60 mt-1">
                        por {t.author} · {t.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-foreground/60">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {t.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {t.replies} respostas
                    </span>
                  </div>
                </div>
              ))}
              {activeTopics.length === 0 && (
                <div className="text-center py-6 text-foreground/50 text-sm">
                  Nenhum tópico ainda. Seja o primeiro!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
