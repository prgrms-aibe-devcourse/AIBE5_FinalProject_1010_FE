import api from './api'

const authService = {
  login: (data) => api.post('/api/auth/login', data),
  signup: (data) => api.post('/api/auth/signup', data),
  refresh: (data) => api.post('/api/auth/refresh', data),
  logout: () => api.post('/api/auth/logout'),
}

export default authService

