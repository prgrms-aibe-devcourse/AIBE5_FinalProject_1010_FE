import api from './api'

const adminService = {
  getPendingTeachers: () => api.get('/api/admin/teachers/pending'),
  approveTeacher: (id, data) => api.patch(/api/admin/teachers/+${id}/approve, data),
  rejectTeacher: (id, data) => api.patch(/api/admin/teachers/+${id}/reject, data),
  getReports: () => api.get('/api/admin/reports'),
  processReport: (id, data) => api.patch(/api/admin/reports/+${id}, data),
  getMembers: (params) => api.get('/api/admin/users', { params }),
}

export default adminService

