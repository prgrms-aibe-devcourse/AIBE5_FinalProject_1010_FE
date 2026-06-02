/**
 * @file subjectApi.js
 * @description 과목(Subject) REST API 호출 모음입니다. (백엔드 SubjectController)
 * - 인증이 필요하므로 authFetch(Authorization 자동 첨부 + 401 시 재발급/재시도)를 사용합니다.
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

/**
 * 과목 목록(수능 8개 대분류) 조회.
 * GET /api/v1/subjects → SubjectResponse[] : { subjectId, name, category }
 */
export async function fetchSubjects() {
  return toJson(await authFetch(`${BASE}/subjects`))
}
