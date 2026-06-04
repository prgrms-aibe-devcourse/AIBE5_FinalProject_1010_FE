/**
 * @file config.js
 * @description API 기본 URL 등 전역 설정값을 제공합니다.
 * - 개발: .env.development (http://localhost:8080)
 * - LAN 테스트: http://{현재 프론트 호스트}:8080
 * - 배포: .env.production (실제 서버 주소)
 * Vite는 빌드 시 VITE_ 접두사 변수를 번들에 인라인합니다.
 */
const configuredApiBase = import.meta.env.VITE_API_BASE?.trim()

function isLocalHost(hostname) {
  return !hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isLocalApiBase(url) {
  try {
    return isLocalHost(new URL(url).hostname)
  } catch {
    return false
  }
}

function defaultApiBase() {
  if (typeof window === 'undefined') return configuredApiBase || 'http://localhost:8080'

  const { protocol, hostname } = window.location
  if (isLocalHost(hostname)) return configuredApiBase || 'http://localhost:8080'
  if (configuredApiBase && !isLocalApiBase(configuredApiBase)) return configuredApiBase

  return `${protocol}//${hostname}:8080`
}

export const API_BASE = defaultApiBase()
