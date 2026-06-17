// SVG icon components for search/teacher search pages.
// All icons use currentColor so they inherit text color from CSS.

export function SearchIcon({ size = 18, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function TeacherHatIcon({ size = 16, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <path d="M2 10l10-5 10 5-10 5z" />
      <path d="M6 12.5V17c0 2 2.7 3 6 3s6-1 6-3v-4.5" />
      <line x1="20" y1="10" x2="20" y2="15" />
    </svg>
  )
}

export function MonitorIcon({ size = 12, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

export function LocationPinIcon({ size = 12, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export function ClockIcon({ size = 13, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function PeopleIcon({ size = 14, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M6 20c0-2.7 1.3-5 3-5s3 2.3 3 5" />
      <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3" />
      <path d="M19 20c0-2.7-1.3-5-3-5" />
    </svg>
  )
}

export function CalendarIcon({ size = 13, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

// 관리자 인증 완료 선생님 표시용 인증 배지 (스캘럽 씰 + 체크). fill=currentColor 로 색상 상속.
export function VerifiedBadgeIcon({ size = 15, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      aria-hidden="true" style={style} className={className}>
      <path fill="currentColor" d="M12 1.6l2.5 1.9 3.1-.2.9 3 2.6 1.7-.9 3 .9 3-2.6 1.7-.9 3-3.1-.2L12 22.4l-2.5-1.9-3.1.2-.9-3-2.6-1.7.9-3-.9-3 2.6-1.7.9-3 3.1.2z" />
      <path d="M8.3 12l2.4 2.4 4.9-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WarningIcon({ size = 48, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function EmptySearchIcon({ size = 48, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
    </svg>
  )
}
