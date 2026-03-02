import { api, extractData, extractPaginated } from './api';

// ==========================================
// AUTH
// ==========================================

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

  async getProfile() { return extractData(await api.get('/auth/me')); },
  async updateProfile(data: Record<string, any>) { return extractData(await api.put('/auth/profile', data)); },

  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('vext_access_token');
    localStorage.removeItem('vext_refresh_token');
    localStorage.removeItem('vext_user');
    window.location.href = '/login';
  },

  getStoredUser() {
    const user = localStorage.getItem('vext_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('vext_access_token');
  },
};

// ==========================================
// CONTACTS
// ==========================================

export const contactService = {
  async list(search?: string, page = 1, limit = 20) {
    const params: any = { page, limit };
    if (search) params.search = search;
    return extractPaginated(await api.get('/contacts', { params }));
  },
  async getById(id: number) { return extractData(await api.get(`/contacts/${id}`)); },
  async create(data: any) { return extractData(await api.post('/contacts', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/contacts/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/contacts/${id}`)); },
  async bulkImport(contacts: any[]) { return extractData(await api.post('/contacts/bulk', contacts)); },
  async getHighChurnRisk() { return extractData(await api.get('/contacts/churn-risk')); },
  async getRepurchaseOpportunities() { return extractData(await api.get('/contacts/repurchase')); },
};

// ==========================================
// DEALS
// ==========================================

export const dealService = {
  async list(page = 1, limit = 100) {
    return extractPaginated(await api.get('/deals', { params: { page, limit } }));
  },
  async getById(id: number) { return extractData(await api.get(`/deals/${id}`)); },
  async create(data: any) { return extractData(await api.post('/deals', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/deals/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/deals/${id}`)); },
  async getStats() { return extractData(await api.get('/deals/stats')); },
};

// ==========================================
// TASKS
// ==========================================

export const taskService = {
  async list(page = 1, limit = 100) {
    return extractPaginated(await api.get('/tasks', { params: { page, limit } }));
  },
  async getById(id: number) { return extractData(await api.get(`/tasks/${id}`)); },
  async getByDate(date: string) { return extractData(await api.get('/tasks/by-date', { params: { date } })); },
  async getByMonth(year: number, month: number) { return extractData(await api.get('/tasks/by-month', { params: { year, month } })); },
  async create(data: any) { return extractData(await api.post('/tasks', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/tasks/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/tasks/${id}`)); },
  async getPendingCount() { return extractData(await api.get('/tasks/pending-count')); },
};

// ==========================================
// TAGS
// ==========================================

export const tagService = {
  async list() { return extractData(await api.get('/tags')); },
  async create(data: any) { return extractData(await api.post('/tags', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/tags/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/tags/${id}`)); },
};

// ==========================================
// PRODUCTS
// ==========================================

export const productService = {
  async list() { return extractData(await api.get('/products')); },
  async getById(id: number) { return extractData(await api.get(`/products/${id}`)); },
  async create(data: any) { return extractData(await api.post('/products', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/products/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/products/${id}`)); },
};

// ==========================================
// TEAM
// ==========================================

export const teamService = {
  async list() { return extractData(await api.get('/team')); },
  async getSellers() { return extractData(await api.get('/team/sellers')); },
  async getSellerRanking() { return extractData(await api.get('/team/ranking')); },
  async updateMember(id: number, data: any) { return extractData(await api.put(`/team/${id}`, data)); },
};

// ==========================================
// INVITES
// ==========================================

export const inviteService = {
  async list() { return extractData(await api.get('/invites')); },
  async create(data: any) { return extractData(await api.post('/invites', data)); },
  async validate(token: string) { return extractData(await api.get(`/invites/validate/${token}`)); },
  async revoke(id: number) { return extractData(await api.put(`/invites/${id}/revoke`)); },
};

// ==========================================
// NOTIFICATIONS
// ==========================================

export const notificationService = {
  async list() { return extractData(await api.get('/notifications')); },
  async getUnreadCount() { return extractData(await api.get('/notifications/unread-count')); },
  async markAsRead(id: number) { return extractData(await api.put(`/notifications/${id}/read`)); },
  async markAllAsRead() { return extractData(await api.put('/notifications/read-all')); },
};

// ==========================================
// DASHBOARD
// ==========================================

export const dashboardService = {
  async getMetrics() { return extractData(await api.get('/dashboard/metrics')); },
  async getGoalProgress() { return extractData(await api.get('/dashboard/goal-progress')); },
  async getTodayTasks() { return extractData(await api.get('/dashboard/today-tasks')); },
};

// ==========================================
// LANDING PAGES
// ==========================================

export const landingPageService = {
  async list() { return extractData(await api.get('/landing-pages')); },
  async getById(id: number) { return extractData(await api.get(`/landing-pages/${id}`)); },
  async getBySlug(slug: string) { return extractData(await api.get(`/landing-pages/slug/${slug}`)); },
  async create(data: any) { return extractData(await api.post('/landing-pages', data)); },
  async update(id: number, data: any) { return extractData(await api.put(`/landing-pages/${id}`, data)); },
  async delete(id: number) { return extractData(await api.delete(`/landing-pages/${id}`)); },
};

// ==========================================
// AI
// ==========================================

export const aiService = {
  async getVextRadar() { return extractData(await api.get('/ai/vext-radar')); },
};
