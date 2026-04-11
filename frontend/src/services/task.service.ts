import { api, extractData, extractPaginated } from './api';

export const taskService = {
  async list(page = 1, limit = 100)             { return extractPaginated(await api.get('/tasks', { params: { page, limit } })); },
  async getById(id: number)                     { return extractData(await api.get(`/tasks/${id}`)); },
  async getByDate(date: string)                 { return extractData(await api.get('/tasks/by-date', { params: { date } })); },
  async getByMonth(year: number, month: number) { return extractData(await api.get('/tasks/by-month', { params: { year, month } })); },
  async create(data: any)                       { return extractData(await api.post('/tasks', data)); },
  async update(id: number, data: any)           { return extractData(await api.put(`/tasks/${id}`, data)); },
  async delete(id: number)                      { return extractData(await api.delete(`/tasks/${id}`)); },
  async getPendingCount()                       { return extractData(await api.get('/tasks/pending-count')); },
};
