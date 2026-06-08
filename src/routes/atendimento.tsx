import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useCommunity } from "@/lib/community-store";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { useSupportMessages, SupportType, SupportStatus } from "@/hooks/useSupportMessages";
import { MessageSquare, Lightbulb, Bug, ArrowLeft, Search, Calendar, Mail } from "lucide-react";

export const Route = createFileRoute("/atendimento")({
  head: () => ({ meta: [{ title: "Atendimento — WEAZE" }] }),
  component: Atendimento,
});

type FilterType = "todos" | SupportType;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "duvida", label: "Dúvidas" },
  { value: "sugestao", label: "Sugestões" },
  { value: "problema", label: "Problemas" },
];

const typeConfig: Record<SupportType, { label: string; icon: React.ReactNode; color: string }> = {
  duvida: { label: "Dúvida", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-100" },
  sugestao: { label: "Sugestão", icon: <Lightbulb className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-100" },
  problema: { label: "Problema", icon: <Bug className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-100" },
};

const statusLabels: Record<SupportStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  respondido: "Respondido",
};

function Atendimento() {
  const { community, userType, auth, hydrated } = useCommunity();
  const nav = useNavigate();

  const communityId = community.name || "default";
  const { messages, updateStatus, getById, stats } = useSupportMessages(communityId);

  const [filter, setFilter] = useState<FilterType>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = messages;
    if (filter !== "todos") {
      list = list.filter((m) => m.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.user_name.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, filter, search]);

  const selected = selectedId ? getById(selectedId) : null;

  if (!hydrated) {
    return (
      <AppShell title="Atendimento">
        <div className="min-h-[50dvh] grid place-items-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!userType.isB2B) {
    nav({ to: "/feed" });
    return null;
  }

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  function getNextStatus(current: SupportStatus): SupportStatus {
    if (current === "pendente") return "em_analise";
    if (current === "em_analise") return "respondido";
    return "pendente";
  }

  function getNextStatusLabel(current: SupportStatus): string {
    if (current === "pendente") return "Marcar como Em Análise";
    if (current === "em_analise") return "Marcar como Respondido";
    return "Reabrir (Pendente)";
  }

  return (
    <AppShell title="Atendimento">
      <div className="px-4 pt-4 pb-24 space-y-5">
        <div className="flex items-center gap-3">
          {selectedId && (
            <button onClick={() => setSelectedId(null)} className="p-1 -ml-1 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-extrabold tracking-tight">Atendimento</h1>
        </div>

        {selected ? (
          <div className="rounded-2xl bg-white border border-border p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {typeConfig[selected.type].icon}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig[selected.type].color}`}>
                  {typeConfig[selected.type].label}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                selected.status === "pendente" ? "bg-secondary text-secondary-foreground" :
                selected.status === "em_analise" ? "bg-[#000000] text-white" :
                "bg-transparent text-foreground border-border"
              }`}>
                {statusLabels[selected.status]}
              </span>
            </div>
            <h2 className="text-base font-bold">{selected.subject}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-foreground/50 text-xs">Nome:</span><p className="font-medium">{selected.user_name}</p></div>
              <div><span className="text-foreground/50 text-xs">Email:</span><p className="font-medium truncate">{selected.user_email}</p></div>
              <div><span className="text-foreground/50 text-xs">Tipo:</span><p className="font-medium">{typeConfig[selected.type].label}</p></div>
              <div><span className="text-foreground/50 text-xs">Data:</span><p className="font-medium text-xs">{formatDate(selected.created_at)}</p></div>
            </div>
            <div>
              <span className="text-xs text-foreground/50">Mensagem:</span>
              <p className="mt-1 text-sm bg-surface-muted rounded-xl p-3 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <WButton variant="outline" size="md" fullWidth onClick={() => {
              const next = getNextStatus(selected.status);
              updateStatus(selected.id, next);
            }}>
              {getNextStatusLabel(selected.status)}
            </WButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Pendentes", value: stats.pendentes },
                { label: "Em Análise", value: stats.em_analise },
                { label: "Respondidas", value: stats.respondidos },
                { label: "Total", value: stats.total },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white border border-border p-4 shadow-soft">
                  <p className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-extrabold mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-[#000000] bg-white"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    filter === opt.value
                      ? "bg-[#000000] text-white"
                      : "bg-secondary text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-foreground/40">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                filtered.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className="w-full text-left rounded-2xl bg-white border border-border p-4 hover:border-[#000000]/20 transition-colors space-y-2 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold truncate">{msg.user_name}</span>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeConfig[msg.type].color}`}>
                          {typeConfig[msg.type].label}
                        </span>
                      </div>
                      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        msg.status === "pendente" ? "bg-secondary text-secondary-foreground" :
                        msg.status === "em_analise" ? "bg-[#000000] text-white" :
                        "bg-transparent text-foreground border-border"
                      }`}>
                        {statusLabels[msg.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                    <div className="flex items-center gap-1 text-xs text-foreground/40">
                      <Calendar className="w-3 h-3" />
                      {formatDate(msg.created_at)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
