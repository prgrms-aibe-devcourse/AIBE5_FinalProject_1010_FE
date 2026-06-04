/**
 * @file AuthBootstrap.jsx
 * @description 앱 최초 마운트 시 refresh API를 1회 호출해 인증 상태를 복구합니다.
 * 소셜 로그인(OAuth2) 콜백도 여기서 처리합니다.
 */

import { useEffect, useRef } from 'react'
import { reissueAccessToken, API_BASE_URL } from './authApi.js'
import { setAccessToken, setTokenLoading } from './tokenStore.js'

/**
 * 기존 회원 소셜 로그인 콜백 처리.
 * BE가 /oauth2/callback?code={oneTimeCode} 로 리다이렉트하면:
 * 1. code를 꺼내 POST /api/v1/auth/oauth2/token 으로 실제 토큰 교환
 * 2. accessToken 메모리 저장 + refreshToken은 서버가 httpOnly 쿠키로 설정
 * 3. /#/ 로 이동
 */
async function handleOAuth2Callback() {
  const params = new URLSearchParams(window.location.search)
  const error  = params.get('error')

  if (error) {
    window.location.replace('/#/login')
    return
  }

  const code = params.get('code')
  if (!code) {
    window.location.replace('/#/login')
    return
  }

  try {
    const res  = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // refreshToken httpOnly 쿠키 수신
      cache: 'no-store',
      body: JSON.stringify({ code })
    })

    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.accessToken) {
        setAccessToken(data.accessToken, data.accessExpiresIn)
      }
    }
    // 실패해도 홈으로 이동 (비로그인 상태로)
  } catch (err) {
    console.warn('[OAuth2] code 교환 실패:', err)
  }

  window.location.replace('/#/')
}

/**
 * 신규 회원 소셜 로그인 처리.
 * BE가 /oauth2/additional-info?token={pendingSocialToken} 로 리다이렉트하면
 * HashRouter 경로로 변환해 추가 정보 입력 페이지를 띄웁니다.
 */
function handleOAuth2AdditionalInfo() {
  const params = new URLSearchParams(window.location.search)
  const token  = params.get('token')

  if (!token) {
    window.location.replace('/#/login')
    return
  }

  window.location.replace('/#/oauth2/additional-info?token=' + encodeURIComponent(token))
}

export default function AuthBootstrap() {
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true

    // 소셜 로그인 콜백 (기존 회원): /oauth2/callback?code=...
    if (window.location.pathname === '/oauth2/callback') {
      setTokenLoading(true)
      handleOAuth2Callback().finally(() => setTokenLoading(false))
      return
    }

    // 소셜 로그인 추가 정보 입력 (신규 회원): /oauth2/additional-info?token=...
    if (window.location.pathname === '/oauth2/additional-info') {
      handleOAuth2AdditionalInfo()
      return
    }

    // 새로고침 직후 access token 메모리를 복구 시도
    setTokenLoading(true)
    reissueAccessToken()
      .catch(() => {})
      .finally(() => setTokenLoading(false))
  }, [])

  return null
}
