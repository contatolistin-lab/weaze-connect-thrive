import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useCommunity } from "@/lib/community-store";
import { useSupportMessages, type SupportType, type SupportStatus } from "@/hooks/useSupportMessages";
import { SupportRequestModal } from "@/components/weaze/SupportRequestModal";
import { AppShell } from "@/components/weaze/AppShell";
import { MessageSquare, Lightbulb, Bug, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/b2c/atendimento")({
  head: () => ({ meta: [{ title: "Atendimento — WEAZE" }] }),
  component: B2CAtendimento,
});

const typeConfig: Record<SupportType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  duvida: { label: "Dúvida", icon: <MessageSquare className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  sugestao: { label: "Sugestão", icon: <Lightbulb className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  problema: { label: "Problema", icon: <Bug className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

const statusConfig: Record<SupportStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pendente: { label: "Pendente", icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50" },
  em_analise: { label: "Em análise", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50" },
  respondido: { label: "Respondido", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-50" },
};

const cardOptions: { type: SupportType; title: string; description: string; icon: React.ReactNode; buttonLabel: string }[] = [
  {
    type: "duvida",
    title: "Enviar Dúvida",
    description: "Faça uma pergunta para a administração da comunidade.",
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    buttonLabel: "Enviar Dúvida",
  },
  {
    type: "sugestao",
    title: "Enviar Sugestão",
    description: "Compartilhe ideias para melhorar a comunidade.",
    icon: <Lightbulb className="w-6 h-6 text-amber-500" />,
    buttonLabel: "Enviar Sugestão",
  },
  {
    type: "problema",
    title: "Reportar Problema",
    description: "Informe erros ou problemas encontrados.",
    icon: <Bug className="w-6 h-6 text-red-500" />,
    buttonLabel: "Reportar Problema",
  },
];

function B2CAtendimento() {
  const { community, auth } = useCommunity();
  const { messages, loading } = useSupportMessages(community.name || "default");

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportType, setSupportType] = useState<SupportType>("duvida");
  const [successMessage, setSuccessMessage] = useState(false);

  const userMessages = useMemo(() => {
    const userEmail = auth.user?.email;
    if (!userEmail) return [];
    return messages
      .filter((m) => m.user_id === userEmail)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages, auth.user?.email]);

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const handleSuccess = () => {
    setSupportOpen(false);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 4000);
  };

  return (
    <AppShell title="Atendimento">
      <div className="px-4 pt-4 pb-24 space-y-6">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Central de Atendimento</h1>
          <p className="text-sm text-foreground/60 mt-1">Como podemos ajudar você?</p>
        </div>

        {successMessage && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 shadow-soft">
            <p className="text-sm font-bold text-green-700">Mensagem enviada com sucesso.</p>
            <p className="text-xs text-green-600 mt-1">
              A administração da comunidade recebeu sua solicitação.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {cardOptions.map((card) => (
            <button
              key={card.type}
              type="button"
              onClick={() => {
                setSupportType(card.type);
                setSupportOpen(true);
              }}
              className="w-full text-left rounded-2xl bg-white border border-border p-5 shadow-soft hover:border-primary/30 transition-colors space-y-3"
            >
              <div className="flex items-center gap-3">
                {card.icon}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold tracking-tight">{card.title}</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">{card.description}</p>
                </div>
              </div>
              <div className="w-full h-10 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{card.buttonLabel}</span>
              </div>
            </button>
          ))}
        </div>

        <SupportRequestModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          communityId={community.name || "default"}
          userId={auth.user?.email || "unknown"}
          userName={auth.user?.name || "Usuário"}
          userEmail={auth.user?.email || ""}
          defaultType={supportType}
          onSuccess={handleSuccess}
        />

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold tracking-tight">Minhas Solicitações</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
            </div>
          ) : userMessages.length === 0 ? (
            <div className="rounded-2xl bg-white border border-border p-8 shadow-soft text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-foreground/20" />
              <p className="text-sm text-foreground/40">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl bg-white border border-border p-4 shadow-soft space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig[msg.type].color} ${typeConfig[msg.type].bg}`}>
                        {typeConfig[msg.type].label}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig[msg.status].color}`}>
                      {statusConfig[msg.status].icon}
                      {statusConfig[msg.status].label}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{msg.subject}</p>
                  <div className="flex items-center gap-1 text-xs text-foreground/40">
                    <Calendar className="w-3 h-3" />
                    {formatDate(msg.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
