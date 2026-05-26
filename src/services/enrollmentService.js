import api from './api'

const enrollmentService = {
  apply: (data) => api.post('/api/enrollments', data),
  approve: (id) => api.patch(/api/enrollments/+${id}/approve),
  reject: (id) => api.patch(/api/enrollments/+${id}/reject),
  getMyEnrollments: () => api.get('/api/enrollments/me'),
  getPendingList: () => api.get('/api/enrollments/pending'),
}

export default enrollmentService

