/**
 * @file AuthBootstrap.jsx
 * @description 앱 최초 마운트 시 refresh API를 1회 호출해 인증 상태를 복구합니다.
 * 소셜 로그인(OAuth2) 콜백도 여기서 처리합니다.
 */

import { useEffect, useRef } from 'react'
import { reissueAccessToken } from './authApi.js'
import { setTokenLoading } from './tokenStore.js'

/**
 * BE의 OAuth2SuccessHandler가 기존 회원에 대해
 * /oauth2/callback?accessToken=...&refreshToken=... 으로 리다이렉트할 때 처리합니다.
 * refreshToken을 쿠키에 저장 후 /#/ 으로 이동하면 일반 bootstrap이 accessToken을 복구합니다.
 */
function handleOAuth2Callback() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')

  if (error) {
    // 소셜 로그인 실패: 로그인 페이지로 이동
    window.location.replace('/#/login')
    return
  }

  const refreshToken = params.get('refreshToken')
  if (refreshToken) {
    // BE의 /api/v1/auth/reissue는 쿠키 이름 'refreshToken'을 읽습니다.
    const maxAge = 7 * 24 * 60 * 60 // 7일 (BE refreshTokenExpiration과 동일)
    document.cookie = `refreshToken=${refreshToken}; path=/; SameSite=Lax; max-age=${maxAge}`
  }

  // /#/로 전체 페이지 이동 → URL에서 토큰 제거 + 일반 bootstrap 흐름 재시작
  window.location.replace('/#/')
}

/**
 * BE의 OAuth2SuccessHandler가 신규 회원에 대해
 * /oauth2/additional-info?token=... 으로 리다이렉트할 때 처리합니다.
 * token을 그대로 해시 라우터 경로로 넘겨 추가 정보 입력 페이지를 띄웁니다.
 */
function handleOAuth2AdditionalInfo() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (!token) {
    window.location.replace('/#/login')
    return
  }

  // HashRouter가 처리할 수 있도록 /#/ 경로 형태로 변환
  window.location.replace('/#/oauth2/additional-info?token=' + encodeURIComponent(token))
}

export default function AuthBootstrap() {
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true

    // 소셜 로그인 콜백 (기존 회원): /oauth2/callback?accessToken=...&refreshToken=...
    if (window.location.pathname === '/oauth2/callback') {
      handleOAuth2Callback()
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
      .catch(() => {
        // 실패 시 비로그인 상태 유지
      })
      .finally(() => {
        setTokenLoading(false)
      })
  }, [])

  return null
}

