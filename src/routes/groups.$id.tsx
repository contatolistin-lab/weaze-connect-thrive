import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Globe, Heart, MessageSquare, Plus } from "lucide-react";
import { getGroup, getGroupTopics, isGroupMember } from "@/lib/mock-data";

export const Route = createFileRoute("/groups/$id")({
  head: () => ({ meta: [{ title: "Grupo — WEAZE" }] }),
  component: GroupDetail,
});

function GroupDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();

  const group = getGroup(id);
  const topics = getGroupTopics(id);

  if (!group) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-extrabold">Grupo não encontrado</h1>
          <button onClick={() => nav({ to: "/groups" })} className="text-sm text-[#d81e62] font-semibold underline">Voltar</button>
        </div>
      </div>
    );
  }

  const userIsMember = isGroupMember(group.id);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
        <div className="flex items-center gap-2 px-3 h-14">
          <button onClick={() => nav({ to: "/groups" })} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-sm">Grupo</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-start gap-3">
            <span className="text-4xl shrink-0">{group.emoji}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold">{group.name}</h1>
              <p className="text-sm text-foreground/60 mt-0.5">{group.topic}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground/50">
                <Globe size={12} />
                <span>{group.privacy === "private" ? "Privado" : "Público"}</span>
                <span>·</span>
                <span>{group.members} membros</span>
                <span>·</span>
                <span>{topics.length} tópicos</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-[#d81e62]">Aberto</span>
              </div>
            </div>
          </div>

          {userIsMember && (
            <div className="mt-3 text-xs text-center text-foreground/50 py-2 font-semibold bg-muted rounded-2xl">
              ✔ Você é membro deste grupo
            </div>
          )}
        </div>

        {userIsMember && (
          <div className="px-4 pt-4 pb-20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Tópicos do grupo</p>
              <button className="text-xs font-semibold text-[#d81e62] flex items-center gap-1">
                <Plus size={12} /> Novo tópico
              </button>
            </div>
            {topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white border border-border p-4 shadow-soft">
                    <p className="font-bold text-sm">{t.title}</p>
                    <p className="text-xs text-foreground/60 mt-1">por {t.author} · {t.createdAt}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-foreground/60">
                      <span className="flex items-center gap-1"><Heart size={12} /> {t.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {t.replies} respostas</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-foreground/50 text-sm">Nenhum tópico ainda. Seja o primeiro!</div>
            )}
          </div>
        )}

        {!userIsMember && (
          <div className="px-4 pt-4 pb-20">
            <div className="text-center py-10 text-foreground/50 text-sm">Você precisa entrar no grupo para ver os tópicos.</div>
          </div>
        )}
      </div>
    </div>
  );
}
