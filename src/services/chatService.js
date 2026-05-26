import api from './api'

const chatService = {
  getRooms: () => api.get('/api/chat/rooms'),
  getMessages: (roomId, params) => api.get(/api/chat/rooms/+${roomId}/messages, { params }),
  createRoom: (targetUserId) => api.post('/api/chat/rooms', { targetUserId }),
}

export default chatService

