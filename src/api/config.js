/**
 * @file config.js
 * @description API 기본 URL 등 전역 설정값을 환경변수에서 읽어 제공합니다.
 * - 개발: .env.development (http://localhost:8080)
 * - 배포: .env.production (실제 서버 주소)
 * Vite는 빌드 시 VITE_ 접두사 변수를 번들에 인라인합니다.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
