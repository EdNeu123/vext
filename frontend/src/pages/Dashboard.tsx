import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign, Check, BarChart3, Wallet,
  Clock, Plus, ChevronRight,
} from 'lucide-react';

import { dashboardService, cardService, taskService, teamService } from '../services';
import type { TimeseriesMetric } from '../services/dashboard.service';
import type { Card, Task } from '../models';
import { formatCurrency, formatCurrencyShort } from '../utils/format';
import { initialsOf, colorForName } from '../utils/avatar';

import Avatar from '../components/ui/Avatar';
import PrimaryButton from '../components/ui/PrimaryButton';
import KpiDetailModal from '../components/dashboard/KpiDetailModal';
import MonthDropdown from '../components/dashboard/MonthDropdown';
import StalledCardsWidget from '../components/dashboard/StalledCardsWidget';
import UpcomingTasksWidget from '../components/dashboard/UpcomingTasksWidget';

// Estágios pra barra do Pipeline (sem 'lost')
const STAGES_FOR_CHART = [
  { key: 'prospecting',   label: 'Prospecção',   short: 'Prosp', color: '#93C5FD' },
  { key: 'qualification', label: 'Qualificação', short: 'Quali', color: '#6EE7B7' },
  { key: 'presentation',  label: 'Apresentação', short: 'Apres', color: '#C4B5FD' },
  { key: 'negotiation',   label: 'Negociação',   short: 'Negoc', color: '#6B7280' },
  { key: 'won',           label: 'Ganho',        short: 'Ganho', color: '#5DCAA5' },
] as const;

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: typeof CircleDollarSign;
  onSeeMore: () => void;
}

function KPICard({ label, value, sub, trend, icon: Icon, onSeeMore }: KPICardProps) {
  const up = trend === undefined || trend >= 0;
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-text-3" strokeWidth={1.8} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-text-3 uppercase tracking-wider flex-1 truncate">{label}</span>
      </div>
      <div className="text-[22px] sm:text-[26px] font-bold text-text-1 leading-none tracking-tight truncate">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 min-h-[18px] flex-wrap">
        {trend !== undefined && (
          <span className="text-[11px] font-semibold" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
            {up ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-[11px] text-text-3 truncate">{sub}</span>}
      </div>
      <button
        onClick={onSeeMore}
        className="mt-3 self-start flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition"
      >
        Ver mais <ChevronRight size={12} />
      </button>
    </div>
  );
}

interface BarChartProps {
  data: { key: string; label: string; short: string; value: number; count: number; color: string }[];
  metric: 'value' | 'count';
}

function PipelineBarChart({ data, metric }: BarChartProps) {
  const maxVal = Math.max(...data.map(d => (metric === 'value' ? d.value : d.count)), 1);
  const chartH = 100;
  return (
    <div className="flex items-end gap-2" style={{ height: chartH + 32 }}>
      {data.map(d => {
        const val = metric === 'value' ? d.value : d.count;
        const pct = val / maxVal;
        const barH = Math.max(pct * chartH, 4);
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="text-[10px] font-semibold text-text-2 whitespace-nowrap">
              {metric === 'value' ? formatCurrencyShort(d.value) : d.count}
            </div>
            <div
              className="w-full rounded-t-sm transition-all duration-700 ease-out"
              style={{ height: barH, background: d.color, minHeight: 4 }}
            />
            <div className="text-[9px] text-text-3 truncate w-full text-center">{d.short}</div>
          </div>
        );
      })}
    </div>
  );
}

const KPI_DEFS: { key: TimeseriesMetric; label: string; icon: typeof CircleDollarSign; modalTitle: string }[] = [
  { key: 'pipeline',  label: 'Pipeline ativo', icon: CircleDollarSign, modalTitle: 'Pipeline ativo · evolução' },
  { key: 'won',       label: 'Cards ganhos',   icon: Check,            modalTitle: 'Cards ganhos · evolução' },
  { key: 'conversion',label: 'Conversão',      icon: BarChart3,        modalTitle: 'Taxa de conversão · evolução' },
  { key: 'avgTicket', label: 'Ticket médio',   icon: Wallet,           modalTitle: 'Ticket médio · evolução' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<'value' | 'count'>('value');
  const [rankView, setRankView] = useState<'team' | 'me'>('team');
  const [openKpi, setOpenKpi] = useState<TimeseriesMetric | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const isCurrentMonth = selectedMonth === currentMonth;

  const { data: monthMetrics } = useQuery({
    queryKey: ['dashboard-monthly', selectedMonth],
    queryFn: () => dashboardService.getMonthly(selectedMonth),
    enabled: !isCurrentMonth,
  });
  const { data: liveMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
    enabled: isCurrentMonth,
  });

  const m = (isCurrentMonth ? liveMetrics : monthMetrics) as any ?? {};

  const { data: cardStats } = useQuery({
    queryKey: ['card-stats'],
    queryFn: () => cardService.getStats(),
  });
  const { data: cardsResult } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardService.list(1, 200),
  });
  const { data: todayTasksData } = useQuery({
    queryKey: ['dashboard-today-tasks'],
    queryFn: () => dashboardService.getTodayTasks(),
  });
  const { data: upcomingTasksResult } = useQuery({
    queryKey: ['tasks-upcoming'],
    queryFn: () => taskService.list(1, 50),
  });
  const { data: ranking } = useQuery({
    queryKey: ['team-ranking'],
    queryFn: () => teamService.getSellerRanking(),
  });

  const cards = ((cardsResult as any)?.data || []) as Card[];
  const todayTasks = (todayTasksData ?? []) as Task[];
  const upcomingTasks = (((upcomingTasksResult as any)?.data) || []) as Task[];

  const rankingList = (() => {
    if (Array.isArray(ranking)) return ranking as any[];
    if (ranking && Array.isArray((ranking as any).ranking)) return (ranking as any).ranking;
    return [];
  })() as { id: number; name: string; salesGoal: number | null; totalValue?: number; total?: number; value?: number }[];

  const pipelineByStage = useMemo(() => {
    const buckets = STAGES_FOR_CHART.map(s => ({ ...s, value: 0, count: 0 }));
    cards.forEach(c => {
      const b = buckets.find(b => b.key === c.stage);
      if (b) {
        b.value += Number(c.value) || 0;
        b.count += 1;
      }
    });
    return buckets;
  }, [cards]);

  const totalActive = pipelineByStage.filter(s => s.key !== 'won').reduce(
    (acc, s) => ({ value: acc.value + s.value, count: acc.count + s.count }),
    { value: 0, count: 0 },
  );

  const nextPending = todayTasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const pendingCount = todayTasks.filter(t => t.status === 'pending').length;

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  const goalTotal = rankingList.reduce((acc, r) => acc + (r.salesGoal ?? 0), 0) || 60000;
  const teamProgress = rankingList.reduce((acc, r) => acc + (r.totalValue ?? r.total ?? r.value ?? 0), 0);
  const displayRanking = rankView === 'team' ? rankingList : rankingList.slice(0, 1);

  const stats = (cardStats ?? {}) as any;
  const totalPipelineVal  = m.totalPipeline  ?? stats.totalPipeline  ?? 0;
  const wonDealsVal       = m.wonDeals       ?? stats.wonDeals       ?? 0;
  const conversionVal     = m.conversionRate ?? stats.conversionRate ?? 0;
  const avgTicketVal      = m.avgDealValue   ?? stats.avgDealValue   ?? 0;
  const wonCount          = m.wonCount       ?? pipelineByStage.find(s => s.key === 'won')?.count ?? 0;
  const lostCount         = m.lostCount      ?? cards.filter(c => c.stage === 'lost').length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-text-1 tracking-tight">Dashboard</h1>
          <p className="text-[12px] sm:text-[13px] text-text-3 mt-1 capitalize">{todayCap}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
          <PrimaryButton onClick={() => navigate('/pipeline')}>
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Novo card</span>
            <span className="sm:hidden">Novo</span>
          </PrimaryButton>
        </div>
      </div>

      {/* KPIs — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPICard
          label={KPI_DEFS[0].label}
          value={formatCurrency(totalPipelineVal)}
          trend={isCurrentMonth ? 12 : undefined}
          sub={isCurrentMonth ? 'vs mês anterior' : `${m.activeDeals ?? 0} cards`}
          icon={KPI_DEFS[0].icon}
          onSeeMore={() => setOpenKpi('pipeline')}
        />
        <KPICard
          label={KPI_DEFS[1].label}
          value={formatCurrency(wonDealsVal)}
          trend={isCurrentMonth ? 8 : undefined}
          sub={`${wonCount} fechados`}
          icon={KPI_DEFS[1].icon}
          onSeeMore={() => setOpenKpi('won')}
        />
        <KPICard
          label={KPI_DEFS[2].label}
          value={`${Number(conversionVal).toFixed(0)}%`}
          sub={`${wonCount} ganhos · ${lostCount} perdidos`}
          icon={KPI_DEFS[2].icon}
          onSeeMore={() => setOpenKpi('conversion')}
        />
        <KPICard
          label={KPI_DEFS[3].label}
          value={formatCurrency(avgTicketVal)}
          trend={isCurrentMonth ? -3 : undefined}
          sub={isCurrentMonth ? 'vs mês anterior' : '—'}
          icon={KPI_DEFS[3].icon}
          onSeeMore={() => setOpenKpi('avgTicket')}
        />
      </div>

      {/* Banner agenda */}
      {pendingCount > 0 && nextPending && (
        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-3 border"
          style={{
            background: 'color-mix(in srgb, #EA580C 8%, var(--surface))',
            borderColor: 'color-mix(in srgb, #EA580C 22%, transparent)',
            borderLeftWidth: 3,
            borderLeftColor: '#EA580C',
          }}
        >
          <Clock size={15} className="flex-shrink-0" style={{ color: '#EA580C' }} />
          <span className="text-[12px] sm:text-[13px] flex-1 leading-relaxed text-text-2 min-w-0">
            <strong style={{ color: '#EA580C' }}>{pendingCount} tarefa{pendingCount > 1 ? 's' : ''}</strong>
            {' · próxima às '}
            <strong style={{ color: '#EA580C' }}>
              {new Date(nextPending.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </strong>
            <span className="hidden sm:inline">
              {' — '}
              <strong style={{ color: '#EA580C' }}>{nextPending.title}</strong>
              {nextPending.contact && ` (${nextPending.contact.name})`}
            </span>
          </span>
          <button
            onClick={() => navigate('/calendar')}
            className="text-[11px] sm:text-[12px] font-semibold flex-shrink-0 whitespace-nowrap hover:opacity-80 transition"
            style={{ color: '#EA580C' }}
          >
            Ver →
          </button>
        </div>
      )}

      {/* Charts row — Pipeline + Ranking. Cards têm altura fixa, scroll interno se overflow. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Pipeline por estágio — altura fixa */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2 flex-shrink-0">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-text-1">Pipeline por estágio</div>
              <div className="text-[11px] text-text-3 mt-0.5 truncate">
                {totalActive.count} ativos · {formatCurrencyShort(totalActive.value)}
              </div>
            </div>
            <div className="flex gap-1.5">
              {(['value', 'count'] as const).map(mtr => (
                <button
                  key={mtr}
                  onClick={() => setMetric(mtr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border border-border transition ${
                    metric === mtr ? 'bg-accent-bg text-accent' : 'bg-transparent text-text-3 hover:text-text-2'
                  }`}
                >
                  {mtr === 'value' ? 'Valor' : 'Qtd.'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-end">
            <div className="w-full">
              <PipelineBarChart data={pipelineByStage} metric={metric} />
            </div>
          </div>
        </div>

        {/* Ranking — altura fixa, scroll interno */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-text-1">Ranking · do mês</div>
              <div className="text-[11px] text-text-3 mt-0.5 truncate">Meta · {formatCurrencyShort(goalTotal)}</div>
            </div>
            <div className="flex border border-border rounded-md overflow-hidden">
              {(['team', 'me'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setRankView(v)}
                  className={`px-3 py-1 text-[11px] font-medium transition ${
                    rankView === v ? 'bg-accent-bg text-accent' : 'bg-transparent text-text-3 hover:text-text-2'
                  }`}
                >
                  {v === 'team' ? 'Equipe' : 'Eu'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2 flex-shrink-0">
            <div className="h-1 bg-border rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((teamProgress / goalTotal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-text-3">{formatCurrencyShort(teamProgress)}</span>
              <span className="text-[11px] text-text-3">
                {Math.round((teamProgress / goalTotal) * 100)}%
              </span>
            </div>
          </div>

          {/* Lista com scroll interno se passar do espaço */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            {displayRanking.length === 0 ? (
              <p className="text-[12px] text-text-3 py-4 text-center">Sem dados de ranking ainda.</p>
            ) : (
              displayRanking.map((mem, i) => {
                const memberValue = mem.totalValue ?? mem.total ?? mem.value ?? 0;
                const memberGoal = mem.salesGoal ?? 20000;
                const pct = Math.min((memberValue / memberGoal) * 100, 100);
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={mem.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className="w-5 text-[13px] text-text-3 text-center flex-shrink-0">
                      {i < 3 ? medals[i] : i + 1}
                    </span>
                    <Avatar initials={initialsOf(mem.name)} size={28} color={colorForName(mem.name)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text-1 truncate">{mem.name}</div>
                      <div className="h-[3px] bg-border rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-semibold text-text-1">
                        {formatCurrencyShort(memberValue)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: cards parados + próximas ações — altura fixa, scroll interno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StalledCardsWidget cards={cards} thresholdDays={7} />
        <UpcomingTasksWidget tasks={upcomingTasks} daysAhead={3} />
      </div>

      {openKpi && (
        <KpiDetailModal
          open={openKpi !== null}
          onClose={() => setOpenKpi(null)}
          metric={openKpi}
          title={KPI_DEFS.find(k => k.key === openKpi)?.modalTitle ?? 'Detalhes'}
        />
      )}
    </div>
  );
}
