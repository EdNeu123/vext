import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  ArrowRight,
  Zap,
  Clock,
  Phone,
  Mail,
  BarChart3,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyShort(value: number) {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return formatCurrency(value);
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "primary" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-medium ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sample data for the revenue chart - in production this would come from the API
const revenueData = [
  { month: "Jul", receita: 45000, meta: 50000 },
  { month: "Ago", receita: 52000, meta: 50000 },
  { month: "Set", receita: 48000, meta: 55000 },
  { month: "Out", receita: 61000, meta: 55000 },
  { month: "Nov", receita: 55000, meta: 60000 },
  { month: "Dez", receita: 72000, meta: 65000 },
];

function RevenueChart() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Receita Recorrente (MRR)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Evolução dos últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Meta</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrencyShort(value)}
                className="text-xs fill-muted-foreground"
                width={70}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#colorReceita)"
                name="Receita"
              />
              <Line
                type="monotone"
                dataKey="meta"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Meta"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.getMetrics.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.team.getSellerRanking.useQuery();
  const { data: vextRadar, isLoading: radarLoading } = trpc.ai.getVextRadar.useQuery();

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pipeline Total"
          value={formatCurrency(metrics?.totalPipeline || 0)}
          subtitle={`${metrics?.activeDeals || 0} oportunidades ativas`}
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Ganhos no Mês"
          value={formatCurrency(metrics?.wonDeals || 0)}
          trend="up"
          trendValue="+12% vs mês anterior"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics?.conversionRate?.toFixed(1) || 0}%`}
          subtitle="Deals fechados / total"
          icon={Target}
          color="amber"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics?.avgDealValue || 0)}
          subtitle="Valor médio por deal ganho"
          icon={BarChart3}
          color="primary"
        />
      </div>

      {/* Revenue Chart + Vext Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart />

        {/* Vext Radar - AI Insights */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Vext Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {radarLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <>
                {/* Churn Alerts */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Alertas de Churn</span>
                  </div>
                  {vextRadar?.churnAlerts && vextRadar.churnAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {vextRadar.churnAlerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="p-2 rounded-lg bg-amber-500/10 text-sm">
                          <p className="font-medium">{alert.name}</p>
                          <p className="text-xs text-muted-foreground">{alert.company}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
                  )}
                </div>

                {/* Repurchase Opportunities */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Oportunidades de Recompra</span>
                  </div>
                  {vextRadar?.repurchaseOpportunities && vextRadar.repurchaseOpportunities.length > 0 ? (
                    <div className="space-y-2">
                      {vextRadar.repurchaseOpportunities.slice(0, 3).map((opp) => (
                        <div key={opp.id} className="p-2 rounded-lg bg-emerald-500/10 text-sm">
                          <p className="font-medium">{opp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            LTV: {formatCurrency(Number(opp.ltv) || 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma oportunidade identificada.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seller Ranking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Ranking de Vendedores</CardTitle>
          <Link href="/team">
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {rankingLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : ranking && ranking.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ranking.slice(0, 6).map((seller, index) => (
                <div key={seller.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-amber-500 text-white"
                        : index === 1
                        ? "bg-slate-400 text-white"
                        : index === 2
                        ? "bg-amber-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{seller.name || "Vendedor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {seller.dealsCount} deals • {formatCurrency(seller.totalValue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{seller.progress.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">da meta</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum vendedor cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SellerDashboard() {
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.getMetrics.useQuery();
  const { data: goalProgress, isLoading: goalLoading } = trpc.dashboard.getSellerGoalProgress.useQuery();
  const { data: todayTasks, isLoading: tasksLoading } = trpc.dashboard.getTodayTasks.useQuery();
  const { data: pendingCount } = trpc.tasks.getPendingCount.useQuery();

  // Sample data for seller's personal performance chart
  const performanceData = [
    { month: "Jul", vendas: 15000, meta: 20000 },
    { month: "Ago", vendas: 22000, meta: 20000 },
    { month: "Set", vendas: 18000, meta: 25000 },
    { month: "Out", vendas: 28000, meta: 25000 },
    { month: "Nov", vendas: 24000, meta: 30000 },
    { month: "Dez", vendas: 32000, meta: 30000 },
  ];

  if (metricsLoading || goalLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Goal Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Sua Meta Mensal</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(goalProgress?.current || 0)} de {formatCurrency(goalProgress?.target || 50000)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{goalProgress?.progress?.toFixed(0) || 0}%</p>
              <p className="text-xs text-muted-foreground">concluído</p>
            </div>
          </div>
          <Progress value={Math.min(goalProgress?.progress || 0, 100)} className="h-3" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Meu Pipeline"
          value={formatCurrency(metrics?.totalPipeline || 0)}
          subtitle={`${metrics?.activeDeals || 0} oportunidades`}
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Ganhos no Mês"
          value={formatCurrency(metrics?.wonDeals || 0)}
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics?.conversionRate?.toFixed(1) || 0}%`}
          icon={Target}
          color="amber"
        />
        <MetricCard
          title="Tarefas Pendentes"
          value={String(pendingCount || 0)}
          subtitle="para hoje"
          icon={CheckCircle}
          color="red"
        />
      </div>

      {/* Performance Chart + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Seu Desempenho
            </CardTitle>
            <p className="text-sm text-muted-foreground">Evolução das suas vendas</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    className="text-xs fill-muted-foreground"
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="vendas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#colorVendas)"
                    name="Vendas"
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Meta"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tarefas de Hoje
            </CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : todayTasks && todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      task.status === "completed" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-secondary/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        task.type === "call"
                          ? "bg-blue-500/10 text-blue-500"
                          : task.type === "meeting"
                          ? "bg-purple-500/10 text-purple-500"
                          : task.type === "email"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.type === "call" ? (
                        <Phone className="w-4 h-4" />
                      ) : task.type === "meeting" ? (
                        <Users className="w-4 h-4" />
                      ) : task.type === "email" ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                      }
                      className="text-[10px] px-1.5"
                    >
                      {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa para hoje!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(" ")[0] || "Usuário"}! 👋
        </h1>
        <p className="text-muted-foreground">
          {user?.role === "admin"
            ? "Aqui está o panorama geral da sua equipe."
            : "Aqui está o resumo do seu dia."}
        </p>
      </div>

      {user?.role === "admin" ? <AdminDashboard /> : <SellerDashboard />}
    </div>
  );
}
