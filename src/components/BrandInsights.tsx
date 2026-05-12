import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, MessageCircle, TrendingUp, Zap, BarChart3, Loader2 } from "lucide-react";

type InsightStats = { total_users: number; active_users: number; feed_engagement: number; conv_engagement: number; avg_cta_interaction: number };

function InsightCard({ label, value, sub, icon: Icon, color, loading }: { label: string; value: string; sub?: string; icon?: React.ElementType; color?: string; loading?: boolean }) {
  if (loading) {
    return (
      <div className="p-3 rounded-xl border border-border bg-muted/30 animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-6 w-12 rounded bg-muted mt-1" />
      </div>
    );
  }
  
  return (
    <div className={cn("p-3 rounded-xl border", color ? `border-${color}/20 bg-${color}/5` : "border-border bg-muted/30")}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={cn("h-4 w-4", color && `text-${color}`)} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-lg font-bold", color && `text-${color}`)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <InsightCard label="" value="" loading />
      <InsightCard label="" value="" loading />
      <InsightCard label="" value="" loading />
      <InsightCard label="" value="" loading />
    </div>
  );
}

export default function BrandInsights(_props: { conversationsCount?: number; ctaClicks?: number } = {}) {
  const { tenant } = useTenant();
  const [insights, setInsights] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) {
      setInsights(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        const now = new Date();
        const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
        
        const [{ data: interactions, error: intErr }, { data: topicsData, error: topicErr }] = await Promise.all([
          supabase.from("interactions").select("action_type, user_id").eq("tenant_id", tenant.id).gte("created_at", d30),
          supabase.from("topic_messages").select("id, user_id").in("topic_id", 
            (await supabase.from("topics").select("id").eq("tenant_id", tenant.id).then(r => r.data?.map(t => t.id) || []))
          ).gte("created_at", d30),
        ]);
        
        if (intErr || topicErr) {
          console.error("BrandInsights query error:", intErr || topicErr);
          setError("Erro ao carregar insights");
          return;
        }
        
        const allInteractions = interactions ?? [];
        const topicsList = topicsData ?? [];
        
        const totalInteractions = allInteractions.length;
        const feedCount = allInteractions.filter((i: any) => i.action_type !== "live_participation").length;
        const convCount = topicsList.length;
        
        const activeUserIds = new Set(allInteractions.map((i: any) => i.user_id).filter(Boolean));
        topicsList.forEach((t: any) => activeUserIds.add(t.user_id));
        
        const uniqueActiveUsers = activeUserIds.size;
        
        const feedPct = totalInteractions > 0 ? Math.round((feedCount / totalInteractions) * 100) : 0;
        const convPct = totalInteractions > 0 ? Math.round((convCount / totalInteractions) * 100) : 0;
        
        const ctaCount = allInteractions.filter((i: any) => i.action_type === "click_cta").length;
        
        setInsights({
          total_users: uniqueActiveUsers,
          active_users: uniqueActiveUsers,
          feed_engagement: feedPct,
          conv_engagement: convPct,
          avg_cta_interaction: totalInteractions > 0 ? Math.round((ctaCount / totalInteractions) * 100) : 0,
        });
      } catch (e) { 
        console.error("BrandInsights:", e);
        setError("Erro ao carregar insights");
      } finally { 
        setLoading(false); 
      }
    })();
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          <h3 className="font-display text-lg">Insights da Marca</h3>
        </div>
        <Skeleton />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          <h3 className="font-display text-lg">Insights da Marca</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{error || "Sem dados suficientes"}</p>
        </div>
      </div>
    );
  }

  const getInsights = () => {
    const list = [];
    const hasAnyInteraction = insights.total_users > 0 || insights.feed_engagement > 0 || insights.conv_engagement > 0;
    
    if (!hasAnyInteraction) {
      list.push({ emoji: "🌱", text: "Sua comunidade está começando. Compartilhe conteúdo para gerar engajamento!" });
      return list;
    }
    
    if (insights.conv_engagement > 30) {
      list.push({ emoji: "💬", text: "Conversas estão com boa interação. Continue estimulando discussões!" });
    } else if (insights.feed_engagement > 70) {
      list.push({ emoji: "📱", text: "Engajamento está no feed. Crie conversas para diversificar." });
    }
    
    if (insights.avg_cta_interaction > 20) {
      list.push({ emoji: "🎯", text: "Seus CTAs estão gerando resultados!" });
    } else if (insights.avg_cta_interaction === 0 && insights.total_users > 0) {
      list.push({ emoji: "⚠️", text: "Seus CTAs ainda não geraram cliques. Tente ofertas mais atrativas." });
    }
    
    if (insights.active_users > 10 && insights.conv_engagement < 10) {
      list.push({ emoji: "💡", text: "Membros ativos mas poucas conversas. Crie tópicos!" });
    }
    
    if (insights.feed_engagement > 0 && insights.conv_engagement === 0) {
      list.push({ emoji: "🔔", text: "Nenhuma conversa ainda. Inicie uma discussão!" });
    }
    
    if (insights.active_users > 0 && insights.avg_cta_interaction === 0) {
      list.push({ emoji: "📣", text: "Adicione CTAs aos seus posts para medir conversões." });
    }
    
    return list;
  };

  const conditionalInsights = getInsights();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-brand" />
        <h3 className="font-display text-lg">Insights da Marca</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InsightCard label="Usuários Ativos" value={insights.active_users.toString()} icon={Users} color="blue" />
        <InsightCard label="Engajamento Feed" value={`${insights.feed_engagement}%`} sub="origem" icon={TrendingUp} color="green" />
        <InsightCard label="Engajamento Conversas" value={`${insights.conv_engagement}%`} sub="origem" icon={MessageCircle} color="purple" />
        <InsightCard label="Interação CTA" value={`${insights.avg_cta_interaction}%`} sub="dos cliques" icon={Zap} color="orange" />
      </div>
      
      {conditionalInsights.length > 0 && (
        <div className="space-y-2">
          {conditionalInsights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm flex items-start gap-2">
              <span className="text-lg">{insight.emoji}</span>
              <span className="text-amber-900">{insight.text}</span>
            </div>
          ))}
        </div>
      )}
      
      {insights.total_users > 0 && (
        insights.feed_engagement > insights.conv_engagement ? (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
            💡 {insights.feed_engagement}% do engajamento vem do <strong>Feed</strong>
          </div>
        ) : insights.conv_engagement > 0 ? (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm">
            💡 {insights.conv_engagement}% do engajamento vem das <strong>Conversas</strong>
          </div>
        ) : null
      )}
    </div>
  );
}