// 수업 대시보드 전용 SVG 아이콘
// style: fill=none, stroke=currentColor, strokeWidth=1.8, round cap/join — 네비 벨 버튼과 동일 기준

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
const ic = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', ...S, 'aria-hidden': true })

export function IcMegaphone({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  )
}

export function IcMessageSquare({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IcClipboard({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="12" y2="16" />
    </svg>
  )
}

export function IcUsers({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IcCalendar({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function IcBarChart({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function IcGraduationCap({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

export function IcVideo({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

export function IcInbox({ size = 36 }) {
  return (
    <svg {...ic(size)} strokeWidth={1.4}>
      <polyline points="2 12 7 12 9 9 15 9 17 12 22 12" />
      <path d="M2.45 15.11L2 12h20l-.45 3.11A2 2 0 0 1 19.56 17H4.44a2 2 0 0 1-1.99-1.89z" />
    </svg>
  )
}

export function IcPencil({ size = 18 }) {
  return (
    <svg {...ic(size)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IcMessageCircle({ size = 14 }) {
  return (
    <svg {...ic(size)} strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
