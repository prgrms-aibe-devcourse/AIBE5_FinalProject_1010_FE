/**
 * @file useChat.js
 * @description 전역 채팅 위젯의 데이터/전송 계층 훅입니다.
 * - 로그인 상태면 STOMP 연결 + 방 목록 로드.
 * - 방을 열면 이전 메시지(REST)를 불러오고 실시간 토픽을 구독, 읽음 처리.
 * - 텍스트/이미지 전송은 STOMP로 보내고, 서버 브로드캐스트(에코)로 화면에 반영됩니다.
 *
 * UI 상태(open/view/input)는 ChatWidget이 관리하고, 이 훅은 "데이터"만 담당합니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMyRooms, fetchMessages, markRoomRead, uploadChatImage } from '../../api/chatApi.js'
import {
  connectChat,
  disconnectChat,
  subscribeRoom,
  subscribeErrors,
  sendChatMessage,
  sendReadReceipt,
  onSocketStatus,
  subscribeNotifications,
} from '../../api/chatSocket.js'
import { formatTime, mapRoom, mapMessage } from '../../api/chatMappers.js'
import { getCurrentUserId } from '../../auth/currentUser.js'
import { hasAccessToken } from '../../auth/tokenStore.js'

/** dataURL(이미지 미리보기)을 업로드 가능한 File로 변환. */
async function dataUrlToFile(dataUrl, name, type) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], name || 'image.png', { type: type || blob.type || 'image/png' })
}

/**
 * @param {object} opts { open: boolean } 패널이 열려있는지(열릴 때 방 목록을 새로고침)
 */
export default function useChat({ open } = {}) {
  const [authed, setAuthed] = useState(hasAccessToken())
  const [rooms, setRooms] = useState([])
  const [messagesByRoom, setMessagesByRoom] = useState({})
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [roomsState, setRoomsState] = useState('idle') // idle | loading | ready | error
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  const myIdRef = useRef(getCurrentUserId())
  const messagesRef = useRef(messagesByRoom)
  messagesRef.current = messagesByRoom

  // 로그인 상태 변화 감지(로그인/로그아웃/토큰 재발급).
  useEffect(() => {
    const onChange = () => {
      const next = hasAccessToken()
      setAuthed(next)
      myIdRef.current = getCurrentUserId()
    }
    window.addEventListener('accessTokenChanged', onChange)
    return () => window.removeEventListener('accessTokenChanged', onChange)
  }, [])

  // 소켓 연결 상태 구독.
  useEffect(() => onSocketStatus((s) => setConnected(s === 'connected')), [])

  const refreshRooms = useCallback(() => {
    setRoomsState('loading')
    return fetchMyRooms()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.content || []
        const mapped = list.map((r) => mapRoom(r, myIdRef.current))
        setRooms(mapped)
        setRoomsState('ready')
        return mapped
      })
      .catch((e) => {
        setError(e?.message || '채팅방을 불러오지 못했어요')
        setRoomsState('error')
      })
  }, [])

  // 로그인되면 연결 + 방 목록 로드. 로그아웃되면 정리.
  useEffect(() => {
    if (!authed) {
      disconnectChat()
      setRooms([])
      setMessagesByRoom({})
      setActiveRoomId(null)
      setRoomsState('idle')
      return
    }
    connectChat().catch((e) => {
      if (e?.message !== 'NO_TOKEN') console.warn('[chat] 연결 실패', e?.message)
    })
    refreshRooms()
  }, [authed, refreshRooms])

  // 패널을 열 때마다 방 목록을 새로고침(안 읽음/마지막 메시지 갱신).
  useEffect(() => {
    if (open && authed) refreshRooms()
  }, [open, authed, refreshRooms])

  // 알림 수신 시(새 메시지 도착 등) 방 목록 갱신 & 10초 폴링 안전망 (실시간 뱃지 동기화)
  useEffect(() => {
    if (!authed) return undefined

    let cancelled = false
    let unsubNoti = () => {}

    const onNoti = () => {
      if (!cancelled) refreshRooms()
    }
    const resubNoti = () => {
      if (cancelled) return
      unsubNoti()
      unsubNoti = subscribeNotifications(onNoti)
    }
    const offSocket = onSocketStatus((s) => {
      if (s === 'connected') resubNoti()
    })
    connectChat().then(resubNoti).catch(() => {})

    // 폴링 안전망 (10초 주기)
    const tick = () => {
      if (!document.hidden) refreshRooms()
    }
    const timer = setInterval(tick, 10000)

    return () => {
      cancelled = true
      unsubNoti()
      offSocket()
      clearInterval(timer)
    }
  }, [authed, refreshRooms])

  // 연결되면 개인 에러 큐 구독.
  useEffect(() => {
    if (!connected) return undefined
    return subscribeErrors((err) => setError(err?.message || '채팅 처리 중 오류가 발생했어요'))
  }, [connected])

  const appendMessage = useCallback((roomId, msg) => {
    setMessagesByRoom((prev) => {
      const list = prev[roomId] || []
      // 같은 messageId가 이미 있으면(에코 중복) 무시.
      if (msg.messageId != null && list.some((m) => m.messageId === msg.messageId)) return prev
      return { ...prev, [roomId]: [...list, msg] }
    })
  }, [])

  const setRoomUnread = useCallback((roomId, unread = 0) => {
    setRooms((prev) => prev.map((room) => (
      room.id === roomId ? { ...room, unread } : room
    )))
  }, [])

  const touchRoomLastMessage = useCallback((roomId, raw, unread = 0) => {
    const lastText = raw?.messageType === 'IMAGE' ? '📷 사진' : raw?.content || ''
    setRooms((prev) => prev.map((room) => (
      room.id === roomId
        ? {
          ...room,
          last: lastText,
          time: formatTime(raw?.sentAt || raw?.createdAt),
          unread,
        }
        : room
    )))
  }, [])

  const readRoomUpTo = useCallback((roomId, messageId) => {
    if (roomId == null || messageId == null) return
    setRoomUnread(roomId, 0)
    sendReadReceipt(roomId, messageId)
    markRoomRead(roomId, messageId).catch(() => {})
  }, [setRoomUnread])

  const activeRoomIdRef = useRef(activeRoomId)
  activeRoomIdRef.current = activeRoomId

  const subscriptionsRef = useRef({})

  // 연결이 끊어지면 모든 구독 정보를 리셋
  useEffect(() => {
    if (!connected) {
      Object.values(subscriptionsRef.current).forEach(unsub => unsub())
      subscriptionsRef.current = {}
    }
  }, [connected])

  // 전체 방 실시간 구독: 내 목록에 있는 모든 방을 구독하여 뱃지와 내용을 실시간으로 업데이트.
  useEffect(() => {
    if (!connected) return

    rooms.forEach(room => {
      if (!subscriptionsRef.current[room.id]) {
        subscriptionsRef.current[room.id] = subscribeRoom(room.id, {
          onMessage: (raw) => {
            const isWatching = (room.id === activeRoomIdRef.current)
            const isFromMe = raw.userId === myIdRef.current
            
            appendMessage(room.id, mapMessage(raw, myIdRef.current))

            if (isWatching) {
              touchRoomLastMessage(room.id, raw, 0)
              readRoomUpTo(room.id, raw.messageId)
            } else {
              setRooms((prev) => prev.map((r) => {
                if (r.id === room.id) {
                  const lastText = raw?.messageType === 'IMAGE' ? '📷 사진' : raw?.content || ''
                  const newUnread = isFromMe ? 0 : (r.unread || 0) + 1
                  return {
                    ...r,
                    last: lastText,
                    time: formatTime(raw?.sentAt || raw?.createdAt),
                    unread: newUnread
                  }
                }
                return r
              }))
            }
          },
          onRead: (raw) => {
            if (raw?.userId === myIdRef.current) setRoomUnread(raw.roomId, 0)
          },
        })
      }
    })
  }, [connected, rooms, appendMessage, touchRoomLastMessage, readRoomUpTo, setRoomUnread])

  /** 방 열기: 활성 방 지정 + 이전 메시지 로드(최초 1회) + 읽음 처리. */
  const openRoom = useCallback(async (roomId) => {
    setActiveRoomId(roomId)
    setError(null)
    if (messagesRef.current[roomId]) {
      const loaded = messagesRef.current[roomId]
      const last = loaded[loaded.length - 1]
      if (last) readRoomUpTo(roomId, last.messageId)
      else setRoomUnread(roomId, 0)
      return
    }
    try {
      const page = await fetchMessages(roomId, { size: 30 })
      const list = page?.messages || []
      const mapped = list.map((m) => mapMessage(m, myIdRef.current))
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: mapped }))
      const last = list[list.length - 1]
      if (last) readRoomUpTo(roomId, last.messageId)
      else setRoomUnread(roomId, 0)
    } catch (e) {
      setError(e?.message || '메시지를 불러오지 못했어요')
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: prev[roomId] || [] }))
    }
  }, [readRoomUpTo, setRoomUnread])

  /** 텍스트 전송(STOMP). 성공 여부 반환. */
  const sendText = useCallback((roomId, text) => {
    const content = (text || '').trim()
    if (!content || roomId == null) return false
    const ok = sendChatMessage(roomId, { messageType: 'TEXT', content })
    if (!ok) setError('연결이 끊겨 전송하지 못했어요. 잠시 후 다시 시도해주세요.')
    return ok
  }, [])

  /** 이미지 전송: 업로드 → fileIds → STOMP IMAGE. caption은 선택. */
  const sendImages = useCallback(async (roomId, attachments, caption = '') => {
    if (roomId == null || !attachments?.length) return false
    try {
      const fileIds = []
      for (const att of attachments) {
        const file = att.file || (att.url ? await dataUrlToFile(att.url, att.name, att.type) : null)
        if (!file) continue
        const uploaded = await uploadChatImage(file)
        if (uploaded?.fileId != null) fileIds.push(uploaded.fileId)
      }
      if (!fileIds.length) {
        setError('이미지 업로드에 실패했어요')
        return false
      }
      const ok = sendChatMessage(roomId, { messageType: 'IMAGE', content: (caption || '').trim(), fileIds })
      if (!ok) setError('연결이 끊겨 이미지를 보내지 못했어요')
      return ok
    } catch (e) {
      setError(e?.message || '이미지 전송에 실패했어요')
      return false
    }
  }, [])

  return {
    authed,
    rooms,
    messagesByRoom,
    activeRoomId,
    connected,
    roomsState,
    error,
    clearError: () => setError(null),
    openRoom,
    sendText,
    sendImages,
    refreshRooms,
  }
}
