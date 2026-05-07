import { api, extractData } from './api';

export interface ProductStats {
  id: number;
  name: string;
  listPrice: number;
  salesCount: number;
  totalRevenue: number;
  avgTicket: number;
  lastSaleAt: string | null;
}

export interface ProductStatsResponse {
  products: ProductStats[];
  totalRevenue: number;
  totalSales: number;
}

export const productService = {
  async list()                        { return extractData(await api.get('/products')); },
  async getById(id: number)           { return extractData(await api.get(`/products/${id}`)); },
  async create(data: any)             { return extractData(await api.post('/products', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/products/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/products/${id}`)); },
  async getStats(): Promise<ProductStatsResponse> {
    return extractData(await api.get('/products/stats'));
  },
};
