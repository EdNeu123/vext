import { api, extractData } from './api';

export const productService = {
  async list()                        { return extractData(await api.get('/products')); },
  async getById(id: number)           { return extractData(await api.get(`/products/${id}`)); },
  async create(data: any)             { return extractData(await api.post('/products', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/products/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/products/${id}`)); },
};
