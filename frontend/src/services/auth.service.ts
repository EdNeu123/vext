import { api, extractData, setAccessToken, getAccessToken } from './api';

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data.data;
    // accessToken em memória/sessionStorage; refreshToken em httpOnly cookie (set pelo backend)
    setAccessToken(accessToken);
    sessionStorage.setItem('vext_user', JSON.stringify(user));
    return { user, accessToken };
  },
  async register(name: string, email: string, password: string, inviteToken?: string) {
    const res = await api.post('/auth/register', { name, email, password, inviteToken });
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    sessionStorage.setItem('vext_user', JSON.stringify(user));
    return { user, accessToken };
  },
  async getProfile()               { return extractData(await api.get('/auth/me')); },
  async updateProfile(data: any)   { return extractData(await api.put('/auth/profile', data)); },
  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    setAccessToken(null);
    sessionStorage.removeItem('vext_user');
    window.location.href = '/login';
  },
  getStoredUser()    { const u = sessionStorage.getItem('vext_user'); return u ? JSON.parse(u) : null; },
  isAuthenticated()  { return !!getAccessToken(); },
};
