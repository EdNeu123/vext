import { api, extractData } from './api';

export const landingPageService = {
  async list()                        { return extractData(await api.get('/landing-pages')); },
  async getById(id: number)           { return extractData(await api.get(`/landing-pages/${id}`)); },
  async getBySlug(slug: string)       { return extractData(await api.get(`/landing-pages/slug/${slug}`)); },
  async create(data: any)             { return extractData(await api.post('/landing-pages', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/landing-pages/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/landing-pages/${id}`)); },
};
