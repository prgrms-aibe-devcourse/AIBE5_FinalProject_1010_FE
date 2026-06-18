/**
 * @file useNotifications.js
 * @description 알림 벨용 상태/동작 훅.
 * - 실시간: STOMP /user/sub/notifications 구독 → 새 알림 즉시 반영(목록 prepend + 뱃지 +1).
 * - 폴링: 10초 주기로 안읽음 수 재동기화(실시간 누락/드리프트 대비 안전망).
 * - 목록은 드롭다운을 열 때 조회. 로그인/로그아웃(accessTokenChanged)에 반응.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { hasAccessToken } from '../../auth/tokenStore.js'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../api/notificationApi.js'
import { connectChat, onSocketStatus, subscribeNotifications } from '../../api/chatSocket.js'
import { showSystemNotification } from './systemNotify.js'
import { notificationRoute } from './notificationRoute.js'

const POLL_INTERVAL_MS = 10_000

export default function useNotifications() {
  const [authed, setAuthed] = useState(hasAccessToken())
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // 로그인 상태 추적
  useEffect(() => {
    const onChange = () => setAuthed(hasAccessToken())
    window.addEventListener('accessTokenChanged', onChange)
    return () => window.removeEventListener('accessTokenChanged', onChange)
  }, [])

  const refreshCount = useCallback(async () => {
    if (!hasAccessToken()) { setUnreadCount(0); return }
    try {
      const data = await fetchUnreadCount()
      setUnreadCount(data?.count ?? 0)
    } catch {
      /* 폴링 실패는 조용히 무시 (다음 주기에 재시도) */
    }
  }, [])

  const loadList = useCallback(async () => {
    if (!hasAccessToken()) return
    setLoading(true)
    try {
      const page = await fetchNotifications(0, 20)
      setItems(page?.content ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 마운트 + 로그인 상태 변화 시 즉시 갱신, 그리고 10초 주기 폴링 (백그라운드 탭 제외)
  useEffect(() => {
    if (!authed) { setUnreadCount(0); setItems([]); return undefined }
    refreshCount()
    const tick = () => { if (!document.hidden) refreshCount() }
    const timer = setInterval(tick, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [authed, refreshCount])

  // 실시간 구독 — 새 알림 도착 시 즉시 목록 prepend + 뱃지 +1. 연결될 때마다 재구독(재연결 복구).
  useEffect(() => {
    if (!authed) return undefined
    let cancelled = false, unsub = () => {}
    const onNoti = (n) => {
      if (cancelled || n?.id == null) return
      setItems(prev => (prev.some(x => x.id === n.id) ? prev : [n, ...prev]))
      setUnreadCount(prev => prev + 1)
      showSystemNotification(n, notificationRoute) // OS 시스템 알림 배너(권한 granted일 때)
    }
    const resub = () => { if (cancelled) return; unsub(); unsub = subscribeNotifications(onNoti) }
    const off = onSocketStatus(s => { if (s === 'connected') resub() })
    connectChat().then(resub).catch(() => {})
    return () => { cancelled = true; unsub(); off() }
  }, [authed])

  const readOne = useCallback(async (id) => {
    // 낙관적 갱신
    setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await markNotificationRead(id)
      refreshCount()  // 성공 후 서버 기준으로 재동기화 (이미 읽음 항목 재클릭 등 엣지케이스 대비)
    } catch {
      refreshCount()  // 실패 시에도 재동기화
    }
  }, [refreshCount])

  const readAll = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      refreshCount()
    }
  }, [refreshCount])

  const removeOne = useCallback(async (id) => {
    // 낙관적 제거
    setItems(prev => prev.filter(n => n.id !== id))
    try {
      await deleteNotification(id)
      refreshCount() // 성공 시 뱃지 재동기화 (안 읽음 항목 삭제 반영)
    } catch {
      // 실패 시 목록·뱃지 모두 서버 기준으로 복구 (낙관적 제거 롤백)
      loadList()
      refreshCount()
    }
  }, [refreshCount, loadList])

  const removeAll = useCallback(async () => {
    setItems([])
    setUnreadCount(0)
    try {
      await deleteAllNotifications()
    } catch {
      // 실패 시 목록·뱃지 모두 서버 기준으로 복구
      loadList()
      refreshCount()
    }
  }, [refreshCount, loadList])

  return { authed, items, unreadCount, loading, refreshCount, loadList, readOne, readAll, removeOne, removeAll }
}
