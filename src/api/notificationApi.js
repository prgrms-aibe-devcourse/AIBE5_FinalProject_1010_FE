/**
 * @file notificationApi.js
 * @description 알림 REST API 호출 모음입니다. (백엔드 NotificationController)
 * - 인증이 필요하므로 authFetch(Authorization 자동 첨부 + 401 시 토큰 재발급/재시도)를 사용합니다.
 * - 실시간 푸시는 사용하지 않으며, 벨 컴포넌트가 폴링·조회합니다.
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

/** 내 알림 목록(최신순, 페이징). GET /api/v1/notifications → Page<NotificationResponse> */
export async function fetchNotifications(page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return toJson(await authFetch(`${BASE}/notifications?${params.toString()}`))
}

/** 안 읽은 알림 수. GET /api/v1/notifications/unread-count → { count } */
export async function fetchUnreadCount() {
  return toJson(await authFetch(`${BASE}/notifications/unread-count`))
}

/** 단건 읽음 처리. PATCH /api/v1/notifications/{id}/read */
export async function markNotificationRead(id) {
  return toJson(await authFetch(`${BASE}/notifications/${id}/read`, { method: 'PATCH' }))
}

/** 전체 읽음 처리. PATCH /api/v1/notifications/read-all */
export async function markAllNotificationsRead() {
  return toJson(await authFetch(`${BASE}/notifications/read-all`, { method: 'PATCH' }))
}

/** 단건 삭제. DELETE /api/v1/notifications/{id} */
export async function deleteNotification(id) {
  return toJson(await authFetch(`${BASE}/notifications/${id}`, { method: 'DELETE' }))
}

/** 전체 삭제. DELETE /api/v1/notifications */
export async function deleteAllNotifications() {
  return toJson(await authFetch(`${BASE}/notifications`, { method: 'DELETE' }))
}
