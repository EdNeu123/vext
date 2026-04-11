import { useQuery } from '@tanstack/react-query';
import { dashboardService, cardService } from '../services';
import { formatCurrency, formatPercent } from '../utils/format';
import { TrendingUp, DollarSign, Target, Users, Activity, CheckSquare, BarChart3, AlertTriangle } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data: metrics } = useQuery({ queryKey: ['dashboard-metrics'], queryFn: () => dashboardService.getMetrics() });
  const { data: goal } = useQuery({ queryKey: ['dashboard-goal'], queryFn: () => dashboardService.getGoalProgress() });
  const { data: stats } = useQuery({ queryKey: ['card-stats'], queryFn: () => cardService.getStats() });

  const m = metrics as any;
  const g = goal as any;
  const s = stats as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do seu CRM</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Pipeline Ativo" value={m ? formatCurrency(m.totalPipeline) : '...'} color="bg-blue-500/10 text-blue-400" />
        <MetricCard icon={TrendingUp} label="Cards Ganhos" value={m ? formatCurrency(m.wonDeals) : '...'} color="bg-emerald-500/10 text-emerald-400" />
        <MetricCard icon={Activity} label="Conversão" value={m ? formatPercent(m.conversionRate) : '...'} color="bg-purple-500/10 text-purple-400" />
        <MetricCard icon={Target} label="Ticket Médio" value={m ? formatCurrency(m.avgDealValue) : '...'} color="bg-amber-500/10 text-amber-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={BarChart3} label="Cards Ativos" value={m?.activeDeals?.toString() || '0'} color="bg-indigo-500/10 text-indigo-400" />
        <MetricCard icon={Users} label="Contatos" value={m?.contactCount?.toString() || '0'} color="bg-cyan-500/10 text-cyan-400" />
        <MetricCard icon={CheckSquare} label="Tarefas Pendentes" value={m?.pendingTasks?.toString() || '0'} color="bg-orange-500/10 text-orange-400" />
        <MetricCard icon={AlertTriangle} label="Cards Perdidos" value={m ? formatCurrency(m.lostDeals) : '...'} color="bg-red-500/10 text-red-400" />
      </div>

      {/* Goal Progress */}
      {g && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Meta de Vendas</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(g.progress, 100)}%` }} />
              </div>
            </div>
            <span className="text-sm font-semibold text-indigo-400">{formatPercent(g.progress)}</span>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Atual: {formatCurrency(g.current)}</span>
            <span>Meta: {formatCurrency(g.target)}</span>
          </div>
        </div>
      )}

      {/* Pipeline by Stage */}
      {s?.byStage && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Pipeline por Etapa</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {s.byStage.map((stage: any) => (
              <div key={stage.stage} className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">{stage.stage}</p>
                <p className="text-xl font-bold mt-1">{stage.count}</p>
                <p className="text-sm text-gray-500">{formatCurrency(stage.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
