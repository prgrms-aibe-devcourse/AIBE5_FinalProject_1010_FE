/**
 * @file subjectApi.js
 * @description 과목(Subject) REST API 호출 모음입니다. (백엔드 SubjectController)
 * - 백엔드 SecurityConfig가 /api/v1/subjects를 인증 필수(anyRequest().authenticated())로
 *   보호하므로 authFetch(Authorization 자동 첨부 + 401 시 재발급/재시도)를 사용해야 합니다.
 *   (이전에 "공개 API"로 오인해 일반 fetch로 바꿨다가 항상 401이 나는 회귀가 있었음)
 */
import { authFetch } from './authFetch.js'
import { API_BASE_URL } from '../auth/authApi.js'
import { toJson } from './apiUtils.js'

const BASE = `${API_BASE_URL}/api/v1`

/**
 * 과목 목록(수능 8개 대분류) 조회.
 * GET /api/v1/subjects → SubjectResponse[] : { subjectId, name, category }
 */
export async function fetchSubjects() {
  return toJson(await authFetch(`${BASE}/subjects`, { cache: 'no-store' }))
}
