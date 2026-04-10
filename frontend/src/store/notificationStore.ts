import { create } from 'zustand';
import type { Notification } from '../models';
import { notificationService } from '../services/notification.service';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: async () => {
    try {
      const [notifications, countData] = await Promise.all([
        notificationService.list(),
        notificationService.getUnreadCount(),
      ]);
      set({
        notifications: notifications as Notification[],
        unreadCount: (countData as any).count || 0,
      });
    } catch {}
  },

  markAsRead: async (id: number) => {
    await notificationService.markAsRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
