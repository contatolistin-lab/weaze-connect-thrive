import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Pin,
  TrendingUp,
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

export const Route = createFileRoute("/conversas/")({
  head: () => ({ meta: [{ title: "Conversas — WEAZE" }] }),
  component: Conversas,
});

const categories = [
  "Todas",
  "Esportes",
  "Música",
  "Tech",
  "Beleza",
  "Lifestyle",
  "Finanças",
  "Cultura",
  "Geral",
];

const initial = { title: "", description: "", tags: "", category: "Geral" };

function Conversas() {
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"recentes" | "trending">("recentes");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initial);
  const all = getAllConversations();

  const filtered = all.filter(
    (c) =>
      (cat === "Todas" || c.category === cat) && c.title.toLowerCase().includes(q.toLowerCase()),
  );

  const pinned = filtered.filter((c) => c.pinned);
  const list =
    tab === "trending" ? filtered.filter((c) => c.trending) : filtered.filter((c) => !c.pinned);

  const submit = () => {
    if (!form.title.trim()) return;
    const id = "ucv_" + Date.now();
    const first = form.title.trim()[0].toUpperCase();
    addUserConversation({
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      author: "Você",
      authorAvatar: first,
      replies: 0,
      likes: 0,
      views: 0,
      pinned: false,
      trending: false,
      createdAt: "agora",
      lastActivity: "agora",
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setForm(initial);
    setShowForm(false);
  };

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

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full h-11 rounded-2xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-brand active:scale-[0.98] transition-transform"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancelar" : "Criar conversa"}
        </button>

        {showForm && (
          <div className="rounded-2xl bg-white border border-border p-4 space-y-3 shadow-soft">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título da conversa"
              className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição (opcional)"
              rows={3}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none"
            />
            <div className="flex gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] bg-white"
              >
                {categories
                  .filter((c) => c !== "Todas")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Tags: separadas por vírgula"
                className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62]"
              />
            </div>
            <button
              onClick={submit}
              disabled={!form.title.trim()}
              className="w-full h-10 rounded-xl bg-brand-gradient text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-brand disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              <Check size={16} /> Publicar conversa
            </button>
          </div>
        )}

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
          {(["recentes", "trending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 ${
                tab === t ? "bg-brand-gradient text-white" : "bg-muted text-foreground/70"
              }`}
            >
              {t === "trending" ? <TrendingUp size={14} /> : <MessageSquare size={14} />}
              {t === "recentes" ? "Recentes" : "Trending"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                cat === c
                  ? "bg-brand-gradient text-white border-transparent"
                  : "bg-white border-border text-foreground/70"
              }`}
            >
              {c}
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

function ConversationCard({ conv }: { conv: ReturnType<typeof getAllConversations>[number] }) {
  return (
    <Link
      to="/conversas/$id"
      params={{ id: conv.id }}
      className="block rounded-2xl bg-white border border-border p-4 shadow-soft hover:shadow-brand transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {conv.pinned && <Pin size={12} className="text-[#d81e62]" />}
            {conv.trending && <Sparkles size={12} className="text-amber-500" />}
            <span className="text-[10px] font-semibold text-[#630091] uppercase">
              {conv.category}
            </span>
          </div>
          <h3 className="mt-1 font-bold text-sm leading-snug">{conv.title}</h3>
          <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{conv.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
        <div className="flex items-center gap-1">
          <span className="h-5 w-5 rounded-full bg-brand-gradient text-white grid place-items-center text-[9px] font-bold">
            {conv.authorAvatar}
          </span>
          <span>{conv.author}</span>
          <span className="text-foreground/40">·</span>
          <span>{conv.createdAt}</span>
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
        {conv.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient-soft text-[#630091] font-semibold"
          >
            #{t}
          </span>
        ))}
      </div>
    </Link>
  );
}
