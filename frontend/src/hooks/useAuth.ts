import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, isAuthenticated, login, logout, register, refreshProfile, initAuth } = useAuthStore();
  return { user, isAuthenticated, login, logout, register, refreshProfile, initAuth };
}
