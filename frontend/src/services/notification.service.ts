import { api, extractData } from './api';

export const notificationService = {
  async list()                  { return extractData(await api.get('/notifications')); },
  async getUnreadCount()        { return extractData(await api.get('/notifications/unread-count')); },
  async markAsRead(id: number)  { return extractData(await api.put(`/notifications/${id}/read`)); },
  async markAllAsRead()         { return extractData(await api.put('/notifications/read-all')); },
};
