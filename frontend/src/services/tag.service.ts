import { api, extractData } from './api';

export interface TagWithUsage {
  id: number;
  label: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export const tagService = {
  async list(includeInactive = false): Promise<TagWithUsage[]> {
    return extractData(await api.get('/tags', { params: { includeInactive } }));
  },
  async create(data: any)             { return extractData(await api.post('/tags', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/tags/${id}`, data)); },
  async delete(id: number, force = false) {
    return extractData(await api.delete(`/tags/${id}`, { params: { force } }));
  },
  async getUsage(id: number) {
    return extractData(await api.get(`/tags/${id}/usage`));
  },
};
