/**
 * @file currentUser.js
 * @description 메모리에 있는 access token(JWT)을 디코드해 현재 사용자 정보를 얻습니다.
 * - 백엔드 JwtTokenProvider는 userId를 JWT subject(sub)에 담습니다. (role은 claims.role)
 * - 서명 검증은 하지 않습니다(서버 몫). 화면 표시/내 메시지 구분 용도로만 payload를 읽습니다.
 */
import { getAccessToken } from './tokenStore.js'

/** base64url 문자열을 UTF-8 JSON 객체로 디코드. */
function decodeBase64Url(segment) {
  const pad = segment.length % 4 ? '='.repeat(4 - (segment.length % 4)) : ''
  const base64 = (segment + pad).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const json = decodeURIComponent(
    binary
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return JSON.parse(json)
}

/** JWT payload를 객체로 반환(실패 시 null). */
export function decodeAccessToken(token = getAccessToken()) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return decodeBase64Url(parts[1])
  } catch {
    return null
  }
}

/** 현재 사용자 id(Number). 토큰이 없거나 파싱 불가면 null. */
export function getCurrentUserId() {
  const payload = decodeAccessToken()
  if (!payload) return null
  const sub = payload.sub ?? payload.userId ?? payload.id
  const n = Number(sub)
  return Number.isFinite(n) ? n : null
}

/** 현재 사용자 role(STUDENT/TEACHER/ADMIN). 없으면 null. */
export function getCurrentUserRole() {
  const payload = decodeAccessToken()
  return payload?.role ?? payload?.claims?.role ?? null
}
