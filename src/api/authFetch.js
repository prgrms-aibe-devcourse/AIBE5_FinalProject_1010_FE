/**
 * @file authFetch.js
 * @description access token 첨부 + 401 시 lazy refresh/retry를 수행하는 fetch 래퍼입니다.
 */

import { getAccessToken, waitForTokenLoadingToFinish } from '../auth/tokenStore.js'
import { reissueAccessToken } from '../auth/authApi.js'

function withAuthHeader(headers = {}) {
  const next = new Headers(headers)
  const token = getAccessToken()
  if (token) next.set('Authorization', `Bearer ${token}`)
  return next
}

/**
 * 인증이 필요한 API 호출용 fetch 래퍼
 * - 최초 요청 실패가 401이면 reissue 후 1회 재시도
 * - reissue 실패 시 원래 401 응답을 그대로 반환
 */
export async function authFetch(input, init = {}) {
  // 앱 초기 refresh가 진행 중이면 완료까지 대기하여 초기 401 난사를 줄입니다.
  await waitForTokenLoadingToFinish()

  const firstInit = {
    ...init,
    credentials: 'include',
    headers: withAuthHeader(init.headers),
    cache: 'no-store'
  }

  let response = await fetch(input, firstInit)

  if (response.status !== 401) return response
  if (firstInit._retried) return response

  const newToken = await reissueAccessToken()
  if (!newToken) return response

  const retryInit = {
    ...init,
    _retried: true,
    credentials: 'include',
    headers: withAuthHeader(init.headers),
    cache: 'no-store'
  }

  response = await fetch(input, retryInit)
  return response
}

