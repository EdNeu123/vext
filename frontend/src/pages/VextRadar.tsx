import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Target,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

interface AIInsight {
  type: "recompra" | "churn" | "upsell" | "followup";
  contactId: number;
  contactName: string;
  companyName: string | null;
  score: number;
  reason: string;
  suggestedAction: string;
  potentialValue: number;
  urgency: "high" | "medium" | "low";
}

function InsightCard({ insight, onAction }: { insight: AIInsight; onAction: () => void }) {
  const typeConfig = {
    recompra: {
      icon: ShoppingCart,
      label: "Oportunidade de Recompra",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    churn: {
      icon: AlertTriangle,
      label: "Risco de Churn",
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    upsell: {
      icon: TrendingUp,
      label: "Potencial de Upsell",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    followup: {
      icon: Clock,
      label: "Follow-up Necessário",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  const urgencyColors = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              <div className={`w-2 h-2 rounded-full ${urgencyColors[insight.urgency]}`} />
            </div>
            <h3 className="font-bold">{insight.contactName}</h3>
            {insight.companyName && (
              <p className="text-sm text-muted-foreground">{insight.companyName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="font-bold text-lg">{insight.score}%</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 inline mr-1 text-primary" />
            Análise da IA:
          </p>
          <p className="text-sm">{insight.reason}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Valor potencial</p>
            <p className="font-bold text-primary">{formatCurrency(insight.potentialValue)}</p>
          </div>
          <Button size="sm" className="gap-2" onClick={onAction}>
            {insight.suggestedAction}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VextRadar() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: radarData, isLoading, refetch } = trpc.ai.getVextRadar.useQuery();

  const runAnalysis = trpc.ai.analyzeDeal.useMutation({
    onMutate: () => {
      setIsAnalyzing(true);
    },
    onSuccess: () => {
      toast.success("Análise concluída! Novos insights disponíveis.");
      refetch();
      setIsAnalyzing(false);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
      setIsAnalyzing(false);
    },
  });

  const handleAction = (insight: AIInsight) => {
    toast.info(`Ação: ${insight.suggestedAction} para ${insight.contactName}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Mock insights for demonstration
  const mockInsights: AIInsight[] = [
    {
      type: "recompra",
      contactId: 1,
      contactName: "Tech Solutions Ltda",
      companyName: "Setor de TI",
      score: 92,
      reason: "Cliente comprou licenças há 11 meses. Padrão histórico indica renovação próxima. Satisfação alta (NPS 9).",
      suggestedAction: "Agendar reunião",
      potentialValue: 45000,
      urgency: "high",
    },
    {
      type: "churn",
      contactId: 2,
      contactName: "Indústria ABC",
      companyName: "Manufatura",
      score: 78,
      reason: "Redução de 40% no uso da plataforma nos últimos 30 dias. Último contato há 45 dias. Ticket de suporte não resolvido.",
      suggestedAction: "Ligar agora",
      potentialValue: 32000,
      urgency: "high",
    },
    {
      type: "upsell",
      contactId: 3,
      contactName: "Startup XYZ",
      companyName: "Tecnologia",
      score: 85,
      reason: "Empresa cresceu 150% no último trimestre. Atingiu limite do plano atual. Histórico de expansão gradual.",
      suggestedAction: "Propor upgrade",
      potentialValue: 28000,
      urgency: "medium",
    },
    {
      type: "followup",
      contactId: 4,
      contactName: "Comércio Digital",
      companyName: "E-commerce",
      score: 71,
      reason: "Proposta enviada há 7 dias sem resposta. Lead qualificado com BANT completo. Decisão prevista para este mês.",
      suggestedAction: "Enviar follow-up",
      potentialValue: 18000,
      urgency: "medium",
    },
  ];

  const recompraInsights = mockInsights.filter((i) => i.type === "recompra");
  const churnInsights = mockInsights.filter((i) => i.type === "churn");
  const upsellInsights = mockInsights.filter((i) => i.type === "upsell");
  const followupInsights = mockInsights.filter((i) => i.type === "followup");

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Vext Radar</h1>
            <Badge className="bg-primary/20 text-primary">
              <Brain className="w-3 h-3 mr-1" />
              IA Preditiva
            </Badge>
          </div>
          <p className="text-muted-foreground">Inteligência preditiva para suas vendas</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => runAnalysis.mutate({ dealId: 0 })}
          disabled={isAnalyzing}
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
          {isAnalyzing ? "Analisando..." : "Executar Análise"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recompraInsights.length}</p>
              <p className="text-sm text-muted-foreground">Oportunidades de Recompra</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{churnInsights.length}</p>
              <p className="text-sm text-muted-foreground">Riscos de Churn</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upsellInsights.length}</p>
              <p className="text-sm text-muted-foreground">Potenciais de Upsell</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(mockInsights.reduce((acc, i) => acc + i.potentialValue, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Valor Total Identificado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Health Score */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Saúde da Base de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Score Geral</span>
                <span className="font-bold">78%</span>
              </div>
              <Progress value={78} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">Baseado em engajamento, satisfação e retenção</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taxa de Retenção Prevista</span>
                <span className="font-bold text-emerald-500">92%</span>
              </div>
              <Progress value={92} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">Próximos 90 dias</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Potencial de Expansão</span>
                <span className="font-bold text-blue-500">65%</span>
              </div>
              <Progress value={65} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">Clientes com potencial de upgrade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recompra */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            Oportunidades de Recompra
          </h2>
          {recompraInsights.length > 0 ? (
            recompraInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} onAction={() => handleAction(insight)} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma oportunidade identificada
              </CardContent>
            </Card>
          )}
        </div>

        {/* Churn */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Alertas de Churn
          </h2>
          {churnInsights.length > 0 ? (
            churnInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} onAction={() => handleAction(insight)} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum risco identificado
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upsell */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Potencial de Upsell
          </h2>
          {upsellInsights.length > 0 ? (
            upsellInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} onAction={() => handleAction(insight)} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum potencial identificado
              </CardContent>
            </Card>
          )}
        </div>

        {/* Follow-up */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Follow-ups Necessários
          </h2>
          {followupInsights.length > 0 ? (
            followupInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} onAction={() => handleAction(insight)} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum follow-up pendente
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
