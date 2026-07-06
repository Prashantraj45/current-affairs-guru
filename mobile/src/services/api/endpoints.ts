import { apiClient } from './client';
export const api = {
  today: () => apiClient.get('/api/today').then((r) => r.data),
  entry: (date: string) => apiClient.get(`/api/date/${date}`).then((r) => r.data),
  topic: (id: string, date?: string) => apiClient.get(`/api/topic/${id}`, { params: date ? { date } : {} }).then((r) => r.data),
  history: (params?: { start?: string; end?: string }) => apiClient.get('/api/history', { params }).then((r) => r.data),
  insights: () => apiClient.get('/api/insights').then((r) => r.data),
  auth: {
    google: (idToken: string) => apiClient.post('/api/auth/google', { idToken }).then((r) => r.data),
    apple: (identityToken: string, fullName?: any, email?: string) => apiClient.post('/api/auth/apple', { identityToken, fullName, email }).then((r) => r.data),
    refresh: (refreshToken: string) => apiClient.post('/api/auth/refresh', { refreshToken }).then((r) => r.data),
    logout: (refreshToken: string) => apiClient.post('/api/auth/logout', { refreshToken }),
  },
  user: {
    me: () => apiClient.get('/api/user/me').then((r) => r.data),
    bookmarks: () => apiClient.get('/api/user/bookmarks').then((r) => r.data),
    addBookmark: (topicId: string, date: string) => apiClient.post(`/api/user/bookmarks/${topicId}`, { date }).then((r) => r.data),
    removeBookmark: (topicId: string) => apiClient.delete(`/api/user/bookmarks/${topicId}`).then((r) => r.data),
    history: (page = 1, limit = 20) => apiClient.get('/api/user/history', { params: { page, limit } }).then((r) => r.data),
    recordRead: (topicId: string, date: string) => apiClient.post('/api/user/history', { topicId, date }),
    registerPushToken: (token: string) => apiClient.post('/api/user/push-token', { token }),
    removePushToken: (token: string) => apiClient.delete('/api/user/push-token', { data: { token } }),
  },
};
