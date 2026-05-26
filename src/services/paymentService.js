import api from './api'

const paymentService = {
  create: (data) => api.post('/api/payments', data),
  getHistory: () => api.get('/api/payments/me'),
}

export default paymentService

