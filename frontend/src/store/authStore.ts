import { create } from 'zustand';
import type { User } from '../models';
import { authService } from '../services/auth.service';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, inviteToken?: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  setUser: (user) => set({ user, isAuthenticated: !!user }),

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
    set({ user: null, isAuthenticated: false });
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
