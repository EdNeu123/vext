import { api, extractData, extractPaginated } from './api';

export const cardService = {
  async list(page = 1, limit = 100)   { return extractPaginated(await api.get('/cards', { params: { page, limit } })); },
  async getById(id: number)           { return extractData(await api.get(`/cards/${id}`)); },
  async create(data: any)             { return extractData(await api.post('/cards', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/cards/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/cards/${id}`)); },
  async getStats()                    { return extractData(await api.get('/cards/stats')); },
};
