import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 10000
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  me:     () => api.get('/api/auth/me').then(r => r.data),
  logout: () => api.post('/api/auth/logout').then(r => r.data),
  loginUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`
};

// ─── Game ─────────────────────────────────────────────────────────────────────
export const gameAPI = {
  getRound:   () => api.get('/api/game/round').then(r => r.data),
  placeBet:   (data: { choices: { symbol: string; amount: number }[]; roundId: string }) =>
    api.post('/api/game/bet', data).then(r => r.data),
  getHistory: (limit = 20) => api.get(`/api/game/history?limit=${limit}`).then(r => r.data),
  getMyBet:   (roundId: string) => api.get(`/api/game/my-bets/${roundId}`).then(r => r.data)
};

// ─── Payment ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createDeposit: (amount: number) =>
    api.post('/api/payment/deposit', { amount }).then(r => r.data),
  checkStatus: (content: string) =>
    api.get(`/api/payment/deposit/${content}/status`).then(r => r.data)
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  profile:      () => api.get('/api/user/profile').then(r => r.data),
  transactions: (params?: { page?: number; type?: string }) =>
    api.get('/api/user/transactions', { params }).then(r => r.data),
  leaderboard:  (by = 'totalWon') =>
    api.get(`/api/user/leaderboard?by=${by}`).then(r => r.data)
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:    () => api.get('/api/admin/dashboard').then(r => r.data),
  analytics:    () => api.get('/api/analytics').then(r => r.data),
  users:        (params?: any) => api.get('/api/admin/users', { params }).then(r => r.data),
  banUser:      (id: string, banned: boolean, reason?: string) =>
    api.patch(`/api/admin/users/${id}/ban`, { banned, reason }).then(r => r.data),
  adjustBalance:(id: string, amount: number, reason: string) =>
    api.patch(`/api/admin/users/${id}/balance`, { amount, reason }).then(r => r.data),
  transactions: (params?: any) => api.get('/api/admin/transactions', { params }).then(r => r.data),
  reviewTx:     (id: string, action: 'confirm' | 'reject', note?: string) =>
    api.patch(`/api/admin/transactions/${id}/review`, { action, note }).then(r => r.data),
  fraudLogs:    (params?: any) => api.get('/api/admin/fraud', { params }).then(r => r.data),
  reviewFraud:  (id: string, status: string, note?: string) =>
    api.patch(`/api/admin/fraud/${id}/review`, { status, note }).then(r => r.data),
  setConfig:    (key: string, value: any, description?: string) =>
    api.put(`/api/admin/config/${key}`, { value, description }).then(r => r.data),
  forceResult:  (dice1: string, dice2: string, dice3: string) =>
    api.post('/api/admin/game/force-result', { dice1, dice2, dice3 }).then(r => r.data)
};

export default api;
