import api from './api'

const qnaService = {
  getQuestions: (params) => api.get('/api/qna', { params }),
  getQuestion: (id) => api.get(/api/qna/+${id}),
  createQuestion: (data) => api.post('/api/qna', data),
  deleteQuestion: (id) => api.delete(/api/qna/+${id}),
  createAnswer: (questionId, data) => api.post(/api/qna/+${questionId}/answers, data),
  adoptAnswer: (answerId) => api.patch(/api/qna/answers/+${answerId}/adopt),
}

export default qnaService

