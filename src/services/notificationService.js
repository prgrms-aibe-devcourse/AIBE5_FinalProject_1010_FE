import api from './api'

const notificationService = {
  getList: () => api.get('/api/notifications'),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  markRead: (id) => api.patch(/api/notifications/+${id}/read),
}

export default notificationService

