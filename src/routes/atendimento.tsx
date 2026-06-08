import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Inbox,
  Clock,
  Loader2,
  CheckCircle2,
  X,
  HelpCircle,
  Lightbulb,
  Bug,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { useCommunity } from "@/lib/community-store";
import {
  useSupportMessages,
  useUpdateSupportStatus,
  communitySlug,
  supportStatusLabel,
  supportStatusColor,
  supportTypeLabel,
  type SupportMessage,
  type SupportStatus,
  type SupportType,
} from "@/lib/support-store";

export const Route = createFileRoute("/atendimento")({
  head: () => ({ meta: [{ title: "Atendimento — WEAZE" }] }),
  component: Atendimento,
});

const typeIcon: Record<SupportType, typeof HelpCircle> = {
  duvida: HelpCircle,
  sugestao: Lightbulb,
  problema: Bug,
};

const filters: Array<{ key: "todos" | SupportType; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "duvida", label: "Dúvidas" },
  { key: "sugestao", label: "Sugestões" },
  { key: "problema", label: "Problemas" },
];

const nextStatus: Record<SupportStatus, SupportStatus | null> = {
  pendente: "em_analise",
  em_analise: "respondido",
  respondido: null,
};

function Atendimento() {
  const nav = useNavigate();
  const { userType, hydrated, community } = useCommunity();
  const cid = communitySlug(community.name);
  const messages = useSupportMessages(cid);
  const updateStatus = useUpdateSupportStatus();

  const [filter, setFilter] = useState<"todos" | SupportType>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !userType.isB2B) nav({ to: "/feed" });
  }, [hydrated, userType.isB2B, nav]);

  const stats = useMemo(() => {
    const pendente = messages.filter((m) => m.status === "pendente").length;
    const em_analise = messages.filter((m) => m.status === "em_analise").length;
    const respondido = messages.filter((m) => m.status === "respondido").length;
    return { pendente, em_analise, respondido, total: messages.length };
  }, [messages]);

  const filtered = useMemo(
    () => (filter === "todos" ? messages : messages.filter((m) => m.type === filter)),
    [messages, filter],
  );

  const selected = filtered.find((m) => m.id === selectedId) ?? messages.find((m) => m.id === selectedId) ?? null;

  if (!hydrated || !userType.isB2B) {
    return (
      <AppShell title="Atendimento">
        <div className="min-h-[50dvh] grid place-items-center">
          <Loader2 className="animate-spin text-foreground/40" />
        </div>
      </AppShell>
    );
  }

  const content = (
    <div className="px-4 pt-4 pb-24 md:pb-8 space-y-5">
      {/* Dashboard */}
      <section>
        <h2 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-3">
          Visão geral
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Clock} label="Pendentes" value={stats.pendente} />
          <StatCard icon={Loader2} label="Em Análise" value={stats.em_analise} />
          <StatCard icon={CheckCircle2} label="Respondidas" value={stats.respondido} />
          <StatCard icon={Inbox} label="Total" value={stats.total} />
        </div>
      </section>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-brand -mx-1 px-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold border transition-colors ${
                active
                  ? "bg-[#630091] text-white border-[#630091]"
                  : "bg-white text-foreground border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <section className="rounded-2xl bg-white border border-border overflow-hidden shadow-soft">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-brand-gradient-soft grid place-items-center mb-3">
              <Inbox size={22} className="text-[#630091]" />
            </div>
            <p className="font-bold text-sm">Nenhuma mensagem por aqui</p>
            <p className="text-xs text-foreground/60 mt-1">
              Quando membros enviarem dúvidas, sugestões ou problemas, aparecerão aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const Icon = typeIcon[m.type];
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted text-left"
                  >
                    <span className="h-10 w-10 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center shrink-0">
                      <Icon size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate">{m.user_name}</p>
                        <span className="text-[10px] font-bold text-foreground/50 uppercase">
                          · {supportTypeLabel[m.type]}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 truncate">{m.subject}</p>
                      <p className="text-[11px] text-foreground/50 mt-0.5">
                        {formatDate(m.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${supportStatusColor[m.status]}`}
                    >
                      {supportStatusLabel[m.status]}
                    </span>
                    <ChevronRight size={16} className="text-foreground/30 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <AppShell title="Atendimento">{content}</AppShell>
      </div>
      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-5xl">{content}</div>
      </div>

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelectedId(null)}
          onAdvance={() => {
            const ns = nextStatus[selected.status];
            if (ns) updateStatus(selected.id, ns);
          }}
          onSet={(s) => updateStatus(selected.id, s)}
        />
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-4 shadow-soft">
      <span className="h-9 w-9 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center">
        <Icon size={18} />
      </span>
      <p className="mt-3 text-xl font-extrabold tracking-tight">{value}</p>
      <p className="text-[11px] text-foreground/60">{label}</p>
    </div>
  );
}

function DetailModal({
  item,
  onClose,
  onAdvance,
  onSet,
}: {
  item: SupportMessage;
  onClose: () => void;
  onAdvance: () => void;
  onSet: (s: SupportStatus) => void;
}) {
  const Icon = typeIcon[item.type];
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-soft border border-border overflow-hidden max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-10 rounded-xl bg-brand-gradient-soft text-[#630091] grid place-items-center shrink-0">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
                {supportTypeLabel[item.type]}
              </p>
              <h2 className="text-base font-extrabold truncate">{item.subject}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Nome" value={item.user_name} />
            <Field label="Email" value={item.user_email} />
            <Field label="Data" value={formatDate(item.created_at)} />
            <Field
              label="Status"
              value={
                <span
                  className={`inline-flex text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${supportStatusColor[item.status]}`}
                >
                  {supportStatusLabel[item.status]}
                </span>
              }
            />
          </div>

          <div>
            <p className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
              Mensagem
            </p>
            <p className="text-sm whitespace-pre-wrap bg-surface-muted rounded-xl p-3 border border-border">
              {item.message}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-2">
              Alterar status
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(supportStatusLabel) as SupportStatus[]).map((s) => {
                const active = item.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onSet(s)}
                    className={`h-9 px-3 rounded-full text-xs font-bold border transition-colors ${
                      active
                        ? "bg-[#630091] text-white border-[#630091]"
                        : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {supportStatusLabel[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3 bg-surface-muted">
          {nextStatus[item.status] ? (
            <button
              onClick={onAdvance}
              className="flex-1 h-11 rounded-2xl bg-brand-gradient text-white font-bold text-sm shadow-brand"
            >
              Avançar para {supportStatusLabel[nextStatus[item.status] as SupportStatus]}
            </button>
          ) : (
            <span className="flex-1 text-center text-xs font-bold text-emerald-700">
              Mensagem já respondida
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="text-sm font-semibold truncate">{value}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
