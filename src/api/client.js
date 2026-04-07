import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sh_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ──────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('sh_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('sh_access_token', data.accessToken);
        localStorage.setItem('sh_refresh_token', data.refreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        refreshQueue.forEach(p => p.resolve(data.accessToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(p => p.reject(refreshErr));
        refreshQueue = [];
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ─── Auth endpoints ──────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  logout: (refreshToken) =>
    api.post('/api/auth/logout', { refreshToken }),
  me: () => api.get('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.put('/api/auth/me/password', { currentPassword, newPassword }),
  register: (data) => api.post('/api/auth/register', data),
};

// ─── Leads endpoints ─────────────────────────────────────
export const leadsApi = {
  list: (params) => api.get('/api/leads', { params }),
  get: (id) => api.get(`/api/leads/${id}`),
  create: (data) => api.post('/api/leads', data),
  update: (id, data) => api.put(`/api/leads/${id}`, data),
  move: (id, status) => api.patch(`/api/leads/${id}/move`, { status }),
  delete: (id) => api.delete(`/api/leads/${id}`),
  bulk: (data) => api.post('/api/leads/bulk', data),
  addNote: (id, text) => api.post(`/api/leads/${id}/notes`, { text }),
  deleteNote: (leadId, noteId) =>
    api.delete(`/api/leads/${leadId}/notes/${noteId}`),
};

// ─── Users endpoints ─────────────────────────────────────
export const usersApi = {
  list: () => api.get('/api/users'),
  get: (id) => api.get(`/api/users/${id}`),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// ─── Dashboard endpoints ─────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/api/dashboard/stats'),
  followups: () => api.get('/api/dashboard/followups'),
};

export default api;
