import { create } from 'zustand';
import type { User, Notification } from '../models';
import { notificationService, authService } from '../services';

interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Auth actions
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, inviteToken?: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Auth state
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Sidebar state
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Notifications
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

  // Auth actions
  login: async (email, password) => {
    const { user } = await authService.login(email, password);
    set({ user: user as User, isAuthenticated: true });
    return user as User;
  },

  register: async (name, email, password, inviteToken?) => {
    const { user } = await authService.register(name, email, password, inviteToken);
    set({ user: user as User, isAuthenticated: true });
    return user as User;
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, notifications: [], unreadCount: 0 });
  },

  refreshProfile: async () => {
    try {
      const profile = await authService.getProfile();
      set({ user: profile as User });
      localStorage.setItem('vext_user', JSON.stringify(profile));
    } catch {}
  },

  initAuth: async () => {
    if (authService.isAuthenticated()) {
      try {
        const profile = await authService.getProfile();
        set({ user: profile as User, isAuthenticated: true });
        localStorage.setItem('vext_user', JSON.stringify(profile));
      } catch {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('vext_access_token');
        localStorage.removeItem('vext_refresh_token');
        localStorage.removeItem('vext_user');
      }
    }
  },
}));
