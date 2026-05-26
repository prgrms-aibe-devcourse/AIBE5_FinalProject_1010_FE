import api from './api'

const userService = {
  getMe: () => api.get('/api/users/me'),
  updatePassword: (data) => api.patch('/api/users/me/password', data),
  deleteAccount: () => api.delete('/api/users/me'),
  getTeacherProfile: (id) => api.get(/api/teachers/+${id}),
  updateTeacherProfile: (data) => api.put('/api/teachers/me', data),
  uploadCertification: (formData) => api.post('/api/teachers/me/certification', formData),
  getStudentProfile: () => api.get('/api/students/me'),
  updateStudentProfile: (data) => api.put('/api/students/me', data),
}

export default userService

