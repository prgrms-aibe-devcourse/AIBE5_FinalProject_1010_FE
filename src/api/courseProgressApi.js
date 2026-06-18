/**
 * @file courseProgressApi.js
 * @description 수업 진도(progress) CRUD API 호출 모음 (이슈 #108 / BE #173).
 * - 작성·수정·삭제는 담당 선생님 전용, 조회는 수업 멤버(담당 선생님·ACTIVE 수강생). 권한은 백엔드가 검증(위반 시 403).
 * - 진도 = { 날짜(progressDate) + 짤막한 내용(content) }.
 */
import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

const BASE = `${API_BASE}/api/v1`

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

/**
 * 진도 목록 조회 (멤버). GET /api/v1/courses/{courseId}/progress
 * - 진도 날짜 최신순(같은 날짜면 작성 최신순). 서버 페이지네이션.
 * @param {number} courseId
 * @param {{page?:number, size?:number}} [opts]
 * @returns {Promise<{content:Array, totalElements:number, totalPages:number, number:number, size:number}>}
 */
export async function fetchCourseProgress(courseId, { page = 0, size = 20 } = {}) {
  return toJson(await authFetch(`${BASE}/courses/${courseId}/progress?page=${page}&size=${size}`))
}

/**
 * 진도 단건 조회 (멤버). GET /api/v1/courses/{courseId}/progress/{progressId}
 * @returns {Promise<{id:number, courseId:number, progressDate:string, content:string, authorId:number, authorName:string, createdAt:string, updatedAt:string}>}
 */
export async function fetchCourseProgressOne(courseId, progressId) {
  return toJson(await authFetch(`${BASE}/courses/${courseId}/progress/${progressId}`))
}

/**
 * 진도 작성 (담당 선생님). POST /api/v1/courses/{courseId}/progress
 * @param {number} courseId
 * @param {{content:string, progressDate?:string}} body progressDate 미지정 시 서버가 오늘 날짜로 저장
 */
export async function createCourseProgress(courseId, { content, progressDate } = {}) {
  return toJson(await authFetch(`${BASE}/courses/${courseId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, progressDate }),
  }))
}

/**
 * 진도 수정 (담당 선생님). PUT /api/v1/courses/{courseId}/progress/{progressId}
 * @param {{content:string, progressDate?:string}} body progressDate 미지정 시 기존 날짜 유지
 */
export async function updateCourseProgress(courseId, progressId, { content, progressDate } = {}) {
  return toJson(await authFetch(`${BASE}/courses/${courseId}/progress/${progressId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, progressDate }),
  }))
}

/**
 * 진도 삭제 (담당 선생님). DELETE /api/v1/courses/{courseId}/progress/{progressId}
 * @returns {Promise<null>} 204 No Content
 */
export async function deleteCourseProgress(courseId, progressId) {
  const res = await authFetch(`${BASE}/courses/${courseId}/progress/${progressId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
  return null
}
