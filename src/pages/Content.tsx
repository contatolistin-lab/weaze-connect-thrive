import { Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { PlusSquare, Calendar, CalendarDays, BarChart3, Lock } from "lucide-react";

/**
 * Tab "Conteúdo" — área do owner para gerenciar posts, agenda e eventos.
 * Para B2C (member), exibe convite para conhecer outras comunidades.
 */
export default function Content() {
  const { tenant, isOwner } = useTenant();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 space-y-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Conteúdo</h1>
          <p className="text-sm text-muted-foreground">
            {isOwner ? `Gerencie ${tenant?.name}` : "Apenas owners da marca podem gerenciar conteúdo."}
          </p>
        </div>

        {isOwner ? (
          <div className="grid gap-3">
            <ContentCard to="/create" icon={PlusSquare} title="Novo post" desc="Vídeo, imagem ou texto + CTA opcional." />
            <ContentCard to="/admin/content" icon={Calendar} title="Serviços e agenda" desc="Cadastre serviços, regras de horário e bloqueios." />
            <ContentCard to="/admin/content" icon={CalendarDays} title="Eventos" desc="Crie eventos com limite de vagas e formulários." />
            <ContentCard to="/admin" icon={BarChart3} title="Painel analítico" desc="Métricas, funil de conversão e exportação." />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Esta área é exclusiva para a marca. Você pode interagir pelo Feed e Conversas.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/communities">Voltar para comunidades</Link>
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ContentCard({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 bg-card hover:bg-secondary/60 border border-border p-4 rounded-2xl shadow-soft transition-all"
    >
      <div className="h-11 w-11 rounded-xl bg-brand-soft grid place-items-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </Link>
  );
}
