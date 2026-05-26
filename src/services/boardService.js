import api from './api'

const boardService = {
  getPosts: (courseId, type, params) => api.get(/api/courses/+${courseId}/boards/+${type}, { params }),
  getPost: (courseId, type, postId) => api.get(/api/courses/+${courseId}/boards/+${type}/+${postId}),
  createPost: (courseId, type, data) => api.post(/api/courses/+${courseId}/boards/+${type}, data),
  updatePost: (courseId, type, postId, data) => api.put(/api/courses/+${courseId}/boards/+${type}/+${postId}, data),
  deletePost: (courseId, type, postId) => api.delete(/api/courses/+${courseId}/boards/+${type}/+${postId}),
  createComment: (postId, data) => api.post(/api/posts/+${postId}/comments, data),
  deleteComment: (commentId) => api.delete(/api/comments/+${commentId}),
}

export default boardService

