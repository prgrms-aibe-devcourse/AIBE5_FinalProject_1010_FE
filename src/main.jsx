/**
 * @file main.jsx
 * @description React 앱의 최초 진입점입니다.
 * - index.html의 #root에 App 컴포넌트를 연결합니다.
 * - 전역 CSS 진입 파일(index.css)을 한 번만 import합니다.
 * - 화면/기능을 고치고 싶다면 App.jsx와 pages 폴더를 보면 됩니다.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'katex/dist/katex.min.css'
import './styles/index.css'

// index.html에 있는 <div id="root"></div>를 찾아 React 렌더링의 시작점으로 사용합니다.
// StrictMode는 개발 중 잠재적인 사이드이펙트 문제를 더 빨리 발견하게 도와줍니다.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
