/**
 * @file chatApi.js
 * @description 채팅 REST API 호출 모음입니다. (백엔드 ChatRoomController / FileController)
 * - 인증이 필요하므로 authFetch(Authorization 자동 첨부 + 401 시 토큰 재발급/재시도)를 사용합니다.
 * - 실시간 송수신은 chatSocket.js(STOMP), 여기서는 방 목록/이전 메시지 조회/이미지 업로드만 담당.
 */
import { authFetch } from './authFetch.js'
import { API_BASE_URL } from '../auth/authApi.js'

const BASE = `${API_BASE_URL}/api/v1`

/** 응답을 JSON으로 파싱하고, 실패 시 message를 담은 Error를 던집니다. */
async function toJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

/** 내 채팅방 목록. GET /api/v1/chat-rooms → ChatRoomResponse[] */
export async function fetchMyRooms() {
  return toJson(await authFetch(`${BASE}/chat-rooms`))
}

/**
 * 1:1(DIRECT) 채팅방 생성 또는 기존 방 반환(서버에서 멱등 처리).
 * POST /api/v1/chat-rooms/direct  body { teacherId, studentId, courseId? }
 */
export async function createDirectRoom({ teacherId, studentId, courseId = null }) {
  return toJson(
    await authFetch(`${BASE}/chat-rooms/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, studentId, courseId }),
    }),
  )
}

/**
 * 수업 단체톡 생성 또는 기존 방 반환.
 * studentIds를 비우면 서버가 해당 수업의 ACTIVE 수강생 전체를 초대합니다.
 */
export async function createCourseGroupRoom({ courseId, studentIds = [] }) {
  return toJson(
    await authFetch(`${BASE}/chat-rooms/course-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, studentIds }),
    }),
  )
}

/** 수업 단체톡에 학생 초대. */
export async function inviteCourseGroupStudents(roomId, studentIds = []) {
  return toJson(
    await authFetch(`${BASE}/chat-rooms/${roomId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds }),
    }),
  )
}

/** 수업 단체톡에서 학생 내보내기. */
export async function removeCourseGroupStudent(roomId, studentId) {
  return toJson(
    await authFetch(`${BASE}/chat-rooms/${roomId}/participants/${studentId}`, {
      method: 'DELETE',
    }),
  )
}

/** REST 읽음 처리. WebSocket read가 연결 타이밍으로 누락될 때를 보완합니다. */
export async function markRoomRead(roomId, lastReadMessageId) {
  return toJson(
    await authFetch(`${BASE}/chat-rooms/${roomId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastReadMessageId }),
    }),
  )
}

/** 선생님 본인 수업 목록. 수업톡 생성에서 사용합니다. */
export async function fetchMyTeacherCourses({ status = 'RECRUITING', size = 100 } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  params.set('size', String(size))
  return toJson(await authFetch(`${BASE}/teachers/me/courses?${params.toString()}`))
}

/** 수업 ACTIVE 수강생 목록. */
export async function fetchCourseStudents(courseId) {
  return toJson(await authFetch(`${BASE}/courses/${courseId}/enrollments`))
}

/**
 * 방의 메시지(커서 기반 페이징). GET /api/v1/chat-rooms/{roomId}/messages?cursor=&size=
 * → { messages: ChatMessageResponse[], nextCursor, hasNext }  (messages는 과거→최신 순)
 */
export async function fetchMessages(roomId, { cursor, size = 30 } = {}) {
  const params = new URLSearchParams()
  if (cursor != null) params.set('cursor', String(cursor))
  params.set('size', String(size))
  return toJson(await authFetch(`${BASE}/chat-rooms/${roomId}/messages?${params.toString()}`))
}

/**
 * 채팅 이미지 1장 업로드. POST /api/v1/files/chat/images (multipart, key: file)
 * → FileUploadResponse { fileId, fileUrl, ... }
 * 반환된 fileId를 STOMP IMAGE 메시지의 fileIds에 넣어 전송합니다.
 * (Content-Type은 지정하지 않습니다 — 브라우저가 multipart boundary를 자동으로 설정)
 */
export async function uploadChatImage(file) {
  const form = new FormData()
  form.append('file', file)
  return toJson(await authFetch(`${BASE}/files/chat/images`, { method: 'POST', body: form }))
}
