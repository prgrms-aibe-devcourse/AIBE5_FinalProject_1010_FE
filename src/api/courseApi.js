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
