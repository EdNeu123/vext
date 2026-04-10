import { api, extractData } from './api';

export const dashboardService = {
  async getMetrics()      { return extractData(await api.get('/dashboard/metrics')); },
  async getGoalProgress() { return extractData(await api.get('/dashboard/goal-progress')); },
  async getTodayTasks()   { return extractData(await api.get('/dashboard/today-tasks')); },
};
