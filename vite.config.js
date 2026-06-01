/**
 * @file vite.config.js
 * @description Vite 개발 서버와 빌드 옵션 설정 파일입니다.
 * - React 플러그인을 적용합니다.
 * - base: './' 옵션으로 정적 배포/로컬 파일 열기 환경에서 경로가 깨지지 않게 합니다.
 * - define.global: sockjs-client가 브라우저에서 참조하는 전역 `global`을 globalThis로 매핑합니다.
 *   (Vite에는 Node의 global이 없어, 이를 정의하지 않으면 채팅 WebSocket(SockJS)에서 런타임 오류가 납니다.)
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { global: 'globalThis' },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, open: true },
})
