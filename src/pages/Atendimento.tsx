import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import FeedLayout from "@/components/layout/FeedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupportMessages, SupportType, SupportStatus } from "@/hooks/useSupportMessages";
import { MessageSquare, Lightbulb, Bug, ArrowLeft, Clock, CheckCircle2, Search, Mail, Calendar } from "lucide-react";

type FilterType = "todos" | SupportType;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "duvida", label: "Dúvidas" },
  { value: "sugestao", label: "Sugestões" },
  { value: "problema", label: "Problemas" },
];

const typeConfig: Record<SupportType, { label: string; icon: React.ReactNode; color: string }> = {
  duvida: { label: "Dúvida", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
  sugestao: { label: "Sugestão", icon: <Lightbulb className="h-4 w-4" />, color: "text-amber-600 bg-amber-100" },
  problema: { label: "Problema", icon: <Bug className="h-4 w-4" />, color: "text-red-600 bg-red-100" },
};

const statusConfig: Record<SupportStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  em_analise: { label: "Em Análise", variant: "default" },
  respondido: { label: "Respondido", variant: "outline" },
};

export default function Atendimento() {
  const { user, isB2B, appRole, initializing, loading: authLoading } = useAuth();
  const { tenant, isOwner, canManage, realLoadDone } = useTenant();
  const nav = useNavigate();

  const authResolved = !initializing && !authLoading && realLoadDone;
  const isAdminUser = authResolved && (isB2B || appRole === "admin" || isOwner || canManage);

  const communityId = tenant?.id ?? "";
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

  if (!authResolved) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="w-8 h-8 border-3 border-t-brand border-brand/20 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminUser) {
    nav("/feed", { replace: true });
    return null;
  }

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
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 space-y-6">
        <div className="flex items-center gap-3">
          {selectedId ? (
            <button onClick={() => setSelectedId(null)} className="p-1 -ml-1 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="font-display text-2xl">Atendimento</h1>
        </div>

        {selected ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeConfig[selected.type].icon}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeConfig[selected.type].color}`}>
                      {typeConfig[selected.type].label}
                    </span>
                  </div>
                  <Badge variant={statusConfig[selected.status].variant}>
                    {statusConfig[selected.status].label}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{selected.subject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{selected.user_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium truncate">{selected.user_email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{typeConfig[selected.type].label}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium text-xs">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Mensagem:</span>
                  <p className="mt-1 text-sm bg-muted rounded-lg p-3 whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const next = getNextStatus(selected.status);
                      updateStatus(selected.id, next);
                    }}
                  >
                    {getNextStatusLabel(selected.status)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.pendentes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Em Análise</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.em_analise}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Respondidas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.respondidos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por assunto, nome ou mensagem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-primary-custom/10 text-primary-custom"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                filtered.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className="w-full text-left bg-card rounded-xl border border-border p-4 hover:border-primary-custom/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{msg.user_name}</span>
                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeConfig[msg.type].color}`}>
                          {typeConfig[msg.type].label}
                        </span>
                      </div>
                      <Badge variant={statusConfig[msg.status].variant} className="shrink-0 text-[10px]">
                        {statusConfig[msg.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(msg.created_at)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
