import { API_BASE } from '../../api/config.js'

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function fmtBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function attachmentIcon(ct) {
  if (!ct) return '📎'
  if (ct.startsWith('image/')) return '🖼️'
  if (ct === 'application/pdf') return '📄'
  return '📎'
}

export function toAbsoluteUrl(url) {
  if (!url) return url
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
export function avatarColor(id) {
  return AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length]
}

export const GRADE_LABELS = {
  ELEM_1: '초1', ELEM_2: '초2', ELEM_3: '초3',
  ELEM_4: '초4', ELEM_5: '초5', ELEM_6: '초6',
  MID_1: '중1', MID_2: '중2', MID_3: '중3',
  HIGH_1: '고1', HIGH_2: '고2', HIGH_3: '고3',
  N_SUNEUNG: 'N수', ADULT: '성인',
}

export const STATUS_LABELS = {
  RECRUITING: '모집 중',
  ACTIVE: '진행 중',
  COMPLETED: '완료',
  CLOSED: '마감',
}

export const STATUS_CLS = {
  RECRUITING: 'status-recruiting',
  ACTIVE:     'status-active',
  COMPLETED:  'status-completed',
  CLOSED:     'status-closed',
}
