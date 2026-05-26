import api from './api'

const aiService = {
  ask: (data) => api.post('/api/ai/ask', data),
  getHistory: () => api.get('/api/ai/history'),
}

export default aiService

