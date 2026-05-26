import api from './api'

const courseService = {
  getList: (params) => api.get('/api/courses', { params }),
  getDetail: (id) => api.get(/api/courses/+${id}),
  create: (data) => api.post('/api/courses', data),
  update: (id, data) => api.put(/api/courses/+${id}, data),
  delete: (id) => api.delete(/api/courses/+${id}),
  getMyCourses: () => api.get('/api/courses/me'),
}

export default courseService

