import { api, extractData } from './api';

export const inviteService = {
  async list()                  { return extractData(await api.get('/invites')); },
  async create(data: any)       { return extractData(await api.post('/invites', data)); },
  async validate(token: string) { return extractData(await api.get(`/invites/validate/${token}`)); },
  async revoke(id: number)      { return extractData(await api.put(`/invites/${id}/revoke`)); },
};
