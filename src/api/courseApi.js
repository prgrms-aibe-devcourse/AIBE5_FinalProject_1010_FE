/**
 * @file courseApi.js
 * @description 수업(Course) 관련 API 모듈
 */
import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

/**
 * 수업 상세 정보를 조회합니다.
 * GET /api/v1/courses/{courseId}
 */
export async function fetchCourseDetail(courseId) {
  const res = await authFetch(`${API_BASE}/api/v1/courses/${courseId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * 수강 신청을 요청합니다.
 * POST /api/v1/courses/{courseId}/enrollment-requests
 */
export async function createEnrollmentRequest(courseId, payload) {
  const res = await authFetch(`${API_BASE}/api/v1/courses/${courseId}/enrollment-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const err = new Error(data?.message || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return res.json().catch(() => null)
}
