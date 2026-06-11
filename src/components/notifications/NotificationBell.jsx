/**
 * @file NotificationBell.jsx
 * @description 네비게이션 바 알림 벨. 안 읽은 개수 뱃지 + 드롭다운 목록.
 * - 벨 클릭 시 목록을 조회하고 드롭다운을 연다.
 * - 항목 클릭 시 해당 알림을 읽음 처리하고 관련 페이지로 이동한다.
 * - 헤더의 "모두 읽음" 버튼으로 전체 읽음 처리.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useNotifications from './useNotifications.js'
import { notificationRoute } from './notificationRoute.js'

const TYPE_ICON = {
  ENROLLMENT_REQUESTED: '📨',
  ENROLLMENT_ACCEPTED:  '🎉',
  ENROLLMENT_REJECTED:  '😢',
  ENROLLMENT_CANCELLED: '↩️',
  QNA_ANSWERED:         '💬',
}

function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const { authed, items, unreadCount, loading, loadList, readOne, readAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // 드롭다운 열 때 + 열려 있는 중 새 알림 도착 시 목록 갱신
  useEffect(() => {
    if (open) loadList()
  }, [open, unreadCount, loadList])

  // Escape 닫기 + 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (!authed) return null

  const handleItemClick = (n) => {
    if (!n.isRead) readOne(n.id)
    setOpen(false)
    const to = notificationRoute(n)
    if (to) navigate(to)
  }

  return (
    <div className="notif" ref={rootRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={() => setOpen(o => !o)}
        aria-label="알림"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="알림 목록">
          <div className="notif-head">
            <span className="notif-head__title">알림</span>
            {unreadCount > 0 && (
              <button type="button" className="notif-head__readall" onClick={readAll}>
                모두 읽음
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading && <div className="notif-empty">불러오는 중…</div>}
            {!loading && items.length === 0 && (
              <div className="notif-empty">새로운 알림이 없어요</div>
            )}
            {!loading && items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`notif-item${n.isRead ? '' : ' notif-item--unread'}`}
                onClick={() => handleItemClick(n)}
              >
                <span className="notif-item__icon" aria-hidden="true">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <span className="notif-item__body">
                  <span className="notif-item__title">{n.title}</span>
                  <span className="notif-item__msg">{n.message}</span>
                  <span className="notif-item__time">{relativeTime(n.createdAt)}</span>
                </span>
                {!n.isRead && <span className="notif-item__dot" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
