import { api, extractData, extractPaginated } from './api';

export const contactService = {
  async list(search?: string, page = 1, limit = 20) {
    const params: any = { page, limit };
    if (search) params.search = search;
    return extractPaginated(await api.get('/contacts', { params }));
  },
  async getById(id: number)            { return extractData(await api.get(`/contacts/${id}`)); },
  async create(data: any)              { return extractData(await api.post('/contacts', data)); },
  async update(id: number, data: any)  { return extractData(await api.put(`/contacts/${id}`, data)); },
  async delete(id: number)             { return extractData(await api.delete(`/contacts/${id}`)); },
  async bulkImport(contacts: any[])    { return extractData(await api.post('/contacts/bulk', contacts)); },
  async getHighChurnRisk()             { return extractData(await api.get('/contacts/churn-risk')); },
  async getRepurchaseOpportunities()   { return extractData(await api.get('/contacts/repurchase')); },
};
