import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useReducer, useState, type FormEvent } from "react";
import {
  Search,
  Pin,
  MessageSquare,
  Heart,
  Eye,
  Plus,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { getAllConversations, addUserConversation } from "@/lib/mock-data";

function ConversasError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <AppShell title="Conversas">
      <div className="px-4 pt-16 text-center">
        <h1 className="text-xl font-extrabold tracking-tight">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível abrir as conversas. Tente novamente ou volte para o feed.
        </p>
        <pre className="mt-4 mx-auto max-w-xs overflow-auto rounded-xl bg-red-50 p-3 text-left text-[11px] text-red-700 border border-red-200">
          {error.message}
          {"\n"}
          {error.stack?.split("\n").slice(0, 3).join("\n")}
        </pre>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="h-10 px-4 rounded-xl bg-brand-gradient text-white text-sm font-bold shadow-brand"
          >
            Tentar novamente
          </button>
          <Link
            to="/feed"
            className="h-10 px-4 rounded-xl border border-border bg-white text-sm font-bold grid place-items-center"
          >
            Ir para o feed
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/conversas/")({
  head: () => ({ meta: [{ title: "Conversas — WEAZE" }] }),
  component: Conversas,
  errorComponent: ({ error, reset }) => <ConversasError error={error} reset={reset} />,
});



function isWithin24h(createdAt: string) {
  const v = String(createdAt || "").trim().toLowerCase();
  if (v === "agora") return true;
  // formatos curtos tipo "2m", "15m", "1h", "23h", "30s"
  if (/^\d+\s*(s|m|min|h|hora|horas|minutos?|segundos?)$/.test(v)) return true;
  return false;
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function Conversas() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"recentes" | "todas">("recentes");
  const [, refreshList] = useReducer((value: number) => value + 1, 0);
  const all = getAllConversations();

  const query = q.trim().toLowerCase();
  const filtered = all.filter((c) => safeText(c.title).toLowerCase().includes(query));

  const pinned = filtered.filter((c) => c.pinned);
  const list =
    tab === "recentes"
      ? filtered.filter((c) => !c.pinned && isWithin24h(c.createdAt))
      : filtered.filter((c) => !c.pinned && !isWithin24h(c.createdAt));


  return (
    <AppShell title="Conversas">
      <div className="px-4 pt-3 space-y-4">
        <div className="rounded-3xl bg-brand-gradient text-white p-5 shadow-brand">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">Fórum WEAZE</p>
          <h2 className="mt-1 text-2xl font-extrabold">Conversas da comunidade</h2>
          <p className="text-sm opacity-90">
            Participe das discussões, tire dúvidas e compartilhe conhecimento.
          </p>
        </div>

        <CriarConversaButton
          onCriar={(dados) => {
            const title = dados.title.trim();
            if (!title) return;
            const id = `ucv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            addUserConversation({
              id,
              title,
              description: dados.description,
              category: "Geral",
              author: "Você",
              authorAvatar: title.at(0)?.toUpperCase() ?? "V",
              replies: 0,
              likes: 0,
              views: 0,
              pinned: false,
              trending: false,
              createdAt: "agora",
              lastActivity: "agora",
              tags: dados.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
            refreshList();
          }}
        />

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 h-11">
          <Search size={18} className="text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conversas..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <div className="flex gap-2">
          {(["recentes", "todas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 ${
                tab === t ? "bg-brand-gradient text-white" : "bg-muted text-foreground/70"
              }`}
            >
              <MessageSquare size={14} />
              {t === "recentes" ? "Recentes" : "Todas"}
            </button>
          ))}
        </div>


        {pinned.length > 0 && (
          <div>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Pin size={12} /> Fixadas
            </p>
            <div className="space-y-2">
              {pinned.map((c) => (
                <ConversationCard key={c.id} conv={c} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pb-4">
          {list.map((c) => (
            <ConversationCard key={c.id} conv={c} />
          ))}
          {list.length === 0 && (
            <div className="text-center py-10 text-foreground/50 text-sm">
              Nenhuma conversa encontrada.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CriarConversaButton({
  onCriar,
}: {
  onCriar: (dados: { title: string; description: string; tags: string }) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!title.trim()) return;
    onCriar({ title: title.trim(), description: description.trim(), tags: tags.trim() });
    setTitle("");
    setDescription("");
    setTags("");
    setAberto(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full h-11 rounded-2xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-brand active:scale-[0.98] transition-transform"
      >
        {aberto ? <X size={18} /> : <Plus size={18} />}
        {aberto ? "Cancelar" : "Criar conversa"}
      </button>

      {aberto && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-border p-4 space-y-3 shadow-soft"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da conversa"
            className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={3}
            className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: separadas por vírgula"
            className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-brand disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            <Check size={16} /> Publicar conversa
          </button>
        </form>
      )}
    </>
  );
}

function ConversationCard({ conv }: { conv: ReturnType<typeof getAllConversations>[number] }) {
  const tags = Array.isArray(conv.tags) ? conv.tags : [];
  const id = conv.id || `ucv_fallback_${conv.title || Math.random()}`;
  const title = safeText(conv.title, "Nova conversa");
  const description = safeText(conv.description);
  const author = safeText(conv.author, "Você");
  const authorAvatar = safeText(conv.authorAvatar, author.charAt(0).toUpperCase() || "V");
  const createdAt = safeText(conv.createdAt, "agora");

  return (
    <Link
      to="/conversas/$id"
      params={{ id }}
      className="block rounded-2xl bg-white border border-border p-4 shadow-soft hover:shadow-brand transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {conv.pinned && <Pin size={12} className="text-[#d81e62]" />}
            {conv.trending && <Sparkles size={12} className="text-amber-500" />}
          </div>
          <h3 className="mt-1 font-bold text-sm leading-snug">{title}</h3>
          <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
        <div className="flex items-center gap-1">
          <span className="h-5 w-5 rounded-full bg-brand-gradient text-white grid place-items-center text-[9px] font-bold">
            {authorAvatar}
          </span>
          <span>{author}</span>
          <span className="text-foreground/40">·</span>
          <span>{createdAt}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Heart size={12} /> {conv.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} /> {conv.replies}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {conv.views}
          </span>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        {tags.slice(0, 3).map((t, i) => (
          <span
            key={t + i}
            className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient-soft text-[#630091] font-semibold"
          >
            #{t}
          </span>
        ))}
      </div>
    </Link>
  );
}
