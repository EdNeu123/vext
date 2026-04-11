import { api, extractData } from './api';

export const aiService = {
  async getVextRadar() { return extractData(await api.get('/ai/vext-radar')); },
};
