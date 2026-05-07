import { api, extractData } from './api';

export type TimeseriesMetric = 'pipeline' | 'won' | 'conversion' | 'avgTicket';
export type TimeseriesPeriod = '7d' | '30d' | '12m';

export interface TimeseriesPoint {
  date: string;   // 'YYYY-MM-DD' ou 'YYYY-MM'
  value: number;
}

export interface TimeseriesResponse {
  metric: TimeseriesMetric;
  period: TimeseriesPeriod;
  points: TimeseriesPoint[];
  comparison: {
    current: number;
    previous: number;
    deltaPct: number | null;
  };
}

export interface MonthlyMetrics {
  month: string;
  totalPipeline: number;
  wonDeals: number;
  wonCount: number;
  lostCount: number;
  activeDeals: number;
  conversionRate: number;
  avgDealValue: number;
  contactCount: number;
  pendingTasks: number;
  isEmpty: boolean;
}

export const dashboardService = {
  async getMetrics()      { return extractData(await api.get('/dashboard/metrics')); },
  async getGoalProgress() { return extractData(await api.get('/dashboard/goal-progress')); },
  async getTodayTasks()   { return extractData(await api.get('/dashboard/today-tasks')); },

  async getTimeseries(metric: TimeseriesMetric, period: TimeseriesPeriod = '30d'): Promise<TimeseriesResponse> {
    return extractData(await api.get('/dashboard/timeseries', { params: { metric, period } }));
  },

  async getMonthly(month: string): Promise<MonthlyMetrics> {
    return extractData(await api.get('/dashboard/monthly', { params: { month } }));
  },
};
