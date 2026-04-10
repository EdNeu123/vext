import { api, extractData } from './api';

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('vext_access_token', accessToken);
    localStorage.setItem('vext_refresh_token', refreshToken);
    localStorage.setItem('vext_user', JSON.stringify(user));
    return { user, accessToken, refreshToken };
  },
  async register(name: string, email: string, password: string, inviteToken?: string) {
    const res = await api.post('/auth/register', { name, email, password, inviteToken });
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('vext_access_token', accessToken);
    localStorage.setItem('vext_refresh_token', refreshToken);
    localStorage.setItem('vext_user', JSON.stringify(user));
    return { user, accessToken, refreshToken };
  },
  async getProfile()               { return extractData(await api.get('/auth/me')); },
  async updateProfile(data: any)   { return extractData(await api.put('/auth/profile', data)); },
  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('vext_access_token');
    localStorage.removeItem('vext_refresh_token');
    localStorage.removeItem('vext_user');
    window.location.href = '/login';
  },
  getStoredUser()    { const u = localStorage.getItem('vext_user'); return u ? JSON.parse(u) : null; },
  isAuthenticated()  { return !!localStorage.getItem('vext_access_token'); },
};
