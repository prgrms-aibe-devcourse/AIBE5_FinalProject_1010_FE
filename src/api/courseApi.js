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
 * 수강 신청을 보냅니다.
 * POST /api/v1/courses/{courseId}/enrollment-requests
 */
export async function createEnrollmentRequest(courseId, { intro, goal, schedule, startWish, message }) {
  const res = await authFetch(`${API_BASE}/api/v1/courses/${courseId}/enrollment-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      introduction: intro,
      goal,
      preferredScheduleNote: schedule,
      preferredStart: startWish,
      message,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `HTTP ${res.status}`)
  }
  return res.json().catch(() => null)
}

/**
 * 마일리지로 수강료를 결제하고 즉시 수강 등록합니다(신청=결제=확정).
 * POST /api/v1/enrollment-requests/courses/{courseId}/enroll
 * @returns {Promise<{courseId:number, mileageBalance:number}>}
 */
export async function enrollWithMileage(courseId) {
  const res = await authFetch(`${API_BASE}/api/v1/enrollment-requests/courses/${courseId}/enroll`, {
    method: 'POST',
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(body?.message || `HTTP ${res.status}`)
    error.status = res.status
    error.code = body?.code   // 잔액 부족이면 INSUFFICIENT_CREDIT
    throw error
  }
  return body
}
