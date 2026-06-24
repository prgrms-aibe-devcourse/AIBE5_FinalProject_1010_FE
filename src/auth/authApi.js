/**
 * @file authApi.js
 * @description 인증 관련 API 유틸입니다.
 */

import { clearAccessToken, setAuthData } from './tokenStore.js'
import { API_BASE } from '../api/config.js'

export const API_BASE_URL = API_BASE

let reissuePromise = null

/**
 * refresh token(httponly 쿠키)로 access token을 재발급합니다.
 * 동시 호출 시 하나의 요청만 수행하도록 single-flight 처리합니다.
 */
export async function reissueAccessToken() {
  if (reissuePromise) return reissuePromise

  reissuePromise = fetch(`${API_BASE_URL}/api/v1/auth/reissue`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store'
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) {
          console.warn('[auth/reissue] 4xx response', {
            status: res.status,
            code: data?.code,
            message: data?.message
          })
        }
        clearAccessToken()
        return null
      }

      if (data?.accessToken) {
        setAuthData(data.accessToken, data.accessExpiresIn, { name: data.name, role: data.role, userId: data.userId })
        return data.accessToken
      }

      clearAccessToken()
      return null
    })
    .catch(() => {
      clearAccessToken()
      return null
    })
    .finally(() => {
      reissuePromise = null
    })

  return reissuePromise
}
