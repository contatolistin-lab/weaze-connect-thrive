import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, MessageCircle, TrendingUp, Zap, BarChart3 } from "lucide-react";

type ActionStats = { type: string; count: number; percentage: number };
type InsightStats = { total_users: number; active_users: number; feed_engagement: number; conv_engagement: number; avg_cta_interaction: number };

function InsightCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon?: React.ElementType; color?: string }) {
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

export default function BrandInsights() {
  const { tenant } = useTenant();
  const [insights, setInsights] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    (async () => {
      try {
        const now = new Date();
        const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
        const [{ data: interactions }, { data: comments }, { data: topics }, { data: ctas }] = await Promise.all([
          supabase.from("interactions").select("action_type").eq("tenant_id", tenant.id).gte("created_at", d30),
          supabase.from("interactions").select("user_id").eq("tenant_id", tenant.id).eq("action_type", "comment").gte("created_at", d30),
          supabase.from("topic_messages").select("user_id").eq("tenant_id", tenant.id).gte("created_at", d30),
          supabase.from("interactions").select("action_type").eq("tenant_id", tenant.id).eq("action_type", "click_cta").gte("created_at", d30),
        ]);
        const allInteractions = interactions ?? [];
        const totalInteractions = allInteractions.length;
        const feedCount = allInteractions.filter((i: any) => i.action_type !== "live_participation").length;
        const convCount = (topics ?? []).length;
        const activeUserIds = new Set(allInteractions.map((i: any) => i.user_id));
        const feedPct = totalInteractions > 0 ? Math.round((feedCount / totalInteractions) * 100) : 0;
        const convPct = totalInteractions > 0 ? Math.round((convCount / totalInteractions) * 100) : 0;
        setInsights({
          total_users: activeUserIds.size,
          active_users: activeUserIds.size,
          feed_engagement: feedPct,
          conv_engagement: convPct,
          avg_cta_interaction: totalInteractions > 0 ? Math.round((ctas ?? []).length / totalInteractions * 100) : 0,
        });
      } catch (e) { console.error("BrandInsights:", e); }
      finally { setLoading(false); }
    })();
  }, [tenant?.id]);

  if (!insights) return null;

  // Gerar insights baseados em regras condicionais
  const getInsights = () => {
    const list = [];
    
    if (insights.conv_engagement > 30) {
      list.push({ emoji: "💬", text: "Conversas estão gerando mais interação. Continue incentivando discussões!" });
    } else if (insights.feed_engagement > 70) {
      list.push({ emoji: "📱", text: "Seu feed está muito engajado. Tente criar conversas para diversificar." });
    }
    
    if (insights.avg_cta_interaction > 20) {
      list.push({ emoji: "🎯", text: "ótimo! Seus CTAs estão funcionando bem." });
    } else if (insights.avg_cta_interaction < 5) {
      list.push({ emoji: "⚠️", text: "CTA com baixa taxa de clique. Tente ofertas mais atrativas." });
    }
    
    if (insights.active_users > 10 && insights.conv_engagement < 10) {
      list.push({ emoji: "💡", text: "Membros ativos mas poucas conversas. Crie tópicos para engajar!" });
    }
    
    if (insights.feed_engagement > 0 && insights.conv_engagement === 0) {
      list.push({ emoji: "🔔", text: "Nenhuma conversa ainda. Inicie uma discussão para criar comunidade." });
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
      
      {/* Insights Condicionais */}
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
      
      {insights.feed_engagement > insights.conv_engagement ? (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
          💡 {insights.feed_engagement}% do engajamento vem do <strong>Feed</strong>
        </div>
      ) : insights.conv_engagement > 0 ? (
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm">
          💡 {insights.conv_engagement}% do engajamento vem das <strong>Conversas</strong>
        </div>
      ) : null}
    </div>
  );
}