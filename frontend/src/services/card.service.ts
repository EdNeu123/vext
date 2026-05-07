import { api, extractData, extractPaginated } from './api';

export type CardEventType =
  | 'created'
  | 'stage_changed'
  | 'value_changed'
  | 'contact_changed'
  | 'tags_changed'
  | 'note_added'
  | 'task_scheduled'
  | 'closed_won'
  | 'closed_lost'
  | 'reopened'
  | 'edited';

export interface CardEvent {
  id: number;
  cardId: number;
  type: CardEventType;
  fromValue: string | null;
  toValue: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  userId: number;
  userName: string;
  createdAt: string;
}

export const cardService = {
  async list(page = 1, limit = 100)   { return extractPaginated(await api.get('/cards', { params: { page, limit } })); },
  async getById(id: number)           { return extractData(await api.get(`/cards/${id}`)); },
  async create(data: any)             { return extractData(await api.post('/cards', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/cards/${id}`, data)); },
  async delete(id: number)            { return extractData(await api.delete(`/cards/${id}`)); },
  async getStats()                    { return extractData(await api.get('/cards/stats')); },
  async getEvents(id: number): Promise<CardEvent[]> {
    return extractData(await api.get(`/cards/${id}/events`));
  },
};
