import api from './api'

const classroomService = {
  getToken: (courseId) => api.post(/api/classrooms/+${courseId}/token),
  open: (courseId) => api.post(/api/classrooms/+${courseId}/open),
  close: (courseId) => api.post(/api/classrooms/+${courseId}/close),
}

export default classroomService

