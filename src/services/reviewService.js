import api from './api'

const reviewService = {
  getReviews: (teacherId, params) => api.get(/api/teachers/+${teacherId}/reviews, { params }),
  createReview: (data) => api.post('/api/reviews', data),
  deleteReview: (id) => api.delete(/api/reviews/+${id}),
}

export default reviewService

