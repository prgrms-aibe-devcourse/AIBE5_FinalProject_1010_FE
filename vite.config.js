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
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  // host: true — 같은 LAN의 다른 기기(노트북/휴대폰)에서 http://{내IP}:5173 으로 접속해
  // 테스트할 수 있게 모든 인터페이스(0.0.0.0)에 바인딩합니다. (백엔드 CORS도 LAN을 허용해야 함)
  server: { port: 5173, open: true, host: true },
})
