import { api, extractData } from './api';

export const teamService = {
  async list()                        { return extractData(await api.get('/team')); },
  async getSellers()                  { return extractData(await api.get('/team/sellers')); },
  async getSellerRanking()            { return extractData(await api.get('/team/ranking')); },
  async updateMember(id: number, data: any) { return extractData(await api.put(`/team/${id}`, data)); },
};
