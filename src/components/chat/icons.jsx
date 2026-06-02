/**
 * @file icons.jsx
 * @description 전역 채팅 위젯에서 공용으로 쓰는 인라인 SVG 아이콘 모음입니다.
 * - 외부 아이콘 라이브러리 의존 없이 currentColor를 따르도록 stroke만 지정합니다.
 */

export function IconChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export function IconChevronDown() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconMessageMenu() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="32" height="25" rx="9" fill="currentColor" opacity="0.14" />
      <path d="M12 17.5h24" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M12 25h18" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" opacity="0.84" />
      <path d="M12 32.5h13" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" opacity="0.68" />
      <path d="M32 28.5h7.5v7.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M39.5 28.5 29.5 38.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="38" cy="12" r="5.5" fill="#f43f5e" />
      <circle cx="38" cy="12" r="2" fill="white" opacity="0.95" />
    </svg>
  )
}

export function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="4" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-4.2-4.2a2 2 0 0 0-2.8 0L5 20" />
      <path d="M14 16l-2.2-2.2a2 2 0 0 0-2.8 0L6 16.8" />
    </svg>
  )
}
