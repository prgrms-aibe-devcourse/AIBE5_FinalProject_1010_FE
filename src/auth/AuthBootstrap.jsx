/**
 * @file AuthBootstrap.jsx
 * @description 앱 최초 마운트 시 refresh API를 1회 호출해 인증 상태를 복구합니다.
 */

import { useEffect, useRef } from 'react'
import { reissueAccessToken } from './authApi.js'
import { setTokenLoading } from './tokenStore.js'

export default function AuthBootstrap() {
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true

    // 새로고침 직후 access token 메모리를 복구 시도
    setTokenLoading(true)
    reissueAccessToken()
      .catch(() => {
        // 실패 시 비로그인 상태 유지
      })
      .finally(() => {
        setTokenLoading(false)
      })
  }, [])

  return null
}

