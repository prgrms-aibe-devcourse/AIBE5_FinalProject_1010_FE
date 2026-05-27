/**
 * @file vite.config.js
 * @description Vite 개발 서버와 빌드 옵션 설정 파일입니다.
 * - React 플러그인을 적용합니다.
 * - base: './' 옵션으로 정적 배포/로컬 파일 열기 환경에서 경로가 깨지지 않게 합니다.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, open: true },
})
