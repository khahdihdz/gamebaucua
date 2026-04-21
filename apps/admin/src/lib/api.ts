import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 15000
});

export const adminAPI = {
  dashboard:    () => api.get('/api/admin/dashboard').then(r => r.data),
  analytics:    () => api.get('/api/analytics').then(r => r.data),
  feed:         () => api.get('/api/analytics/feed').then(r => r.data),

  users:        (p?: any) => api.get('/api/admin/users', { params: p }).then(r => r.data),
  banUser:      (id: string, banned: boolean, reason?: string) =>
    api.patch(`/api/admin/users/${id}/ban`, { banned, reason }).then(r => r.data),
  adjustBal:    (id: string, amount: number, reason: string) =>
    api.patch(`/api/admin/users/${id}/balance`, { amount, reason }).then(r => r.data),
  setRole:      (id: string, role: string) =>
    api.patch(`/api/admin/users/${id}/role`, { role }).then(r => r.data),

  transactions: (p?: any) => api.get('/api/admin/transactions', { params: p }).then(r => r.data),
  reviewTx:     (id: string, action: 'confirm'|'reject', note?: string) =>
    api.patch(`/api/admin/transactions/${id}/review`, { action, note }).then(r => r.data),

  fraudLogs:    (p?: any) => api.get('/api/admin/fraud', { params: p }).then(r => r.data),
  reviewFraud:  (id: string, status: string, note?: string) =>
    api.patch(`/api/admin/fraud/${id}/review`, { status, note }).then(r => r.data),

  getConfig:    () => api.get('/api/admin/config').then(r => r.data),
  setConfig:    (key: string, value: any, desc?: string) =>
    api.put(`/api/admin/config/${key}`, { value, description: desc }).then(r => r.data),
  forceResult:  (d1: string, d2: string, d3: string) =>
    api.post('/api/admin/game/force-result', { dice1: d1, dice2: d2, dice3: d3 }).then(r => r.data),

  bots:         () => api.get('/api/admin/bots').then(r => r.data),
  updateBot:    (id: string, data: any) =>
    api.patch(`/api/admin/bots/${id}`, data).then(r => r.data)
};

export default api;
