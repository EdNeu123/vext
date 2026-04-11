import { api, extractData } from './api';

export const tagService = {
  async list()                        { return extractData(await api.get('/tags')); },
  async create(data: any)             { return extractData(await api.post('/tags', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/tags/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/tags/${id}`)); },
};
