/**
 * @file teacherApi.js
 * @description 선생님 관련 공개 REST API 호출 모음입니다. (백엔드 TeacherController)
 * - 목록/상세/HOT 선생님은 비로그인 포함 공개 GET이므로 인증 없는 일반 fetch를 사용합니다.
 */
import { API_BASE_URL } from '../auth/authApi.js'

const BASE = `${API_BASE_URL}/api/v1`

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
 * 이번주 HOT 선생님 조회 — 지난 7일 내공 획득 상위 TOP3 (비로그인 공개).
 * GET /api/v1/teachers/hot
 * @returns {Promise<Array<{rank:number, teacherProfileId:number, name:string, profileImageUrl:string|null, subject:string|null, weeklyNaegongGain:number}>>}
 */
export async function fetchHotTeachers() {
  return toJson(await fetch(`${BASE}/teachers/hot`))
}
