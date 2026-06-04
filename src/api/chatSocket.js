/**
 * @file chatSocket.js
 * @description STOMP over SockJS 클라이언트 매니저(싱글턴)입니다.
 * - 백엔드 WebSocketConfig는 /ws-stomp 엔드포인트를 .withSockJS()로만 등록하므로
 *   반드시 SockJS로 연결합니다(raw ws:// 불가).
 * - CONNECT 시 STOMP 헤더에 Authorization: Bearer {accessToken}을 실어 인증합니다.
 *   (서버 WebSocketAuthChannelInterceptor가 CONNECT 프레임의 이 헤더를 읽어 userId를 셋팅)
 * - 보내기: /pub/chat-rooms/{roomId}/messages, /pub/chat-rooms/{roomId}/read, /pub/chat-rooms/{roomId}/calls
 * - 받기  : /sub/chat-rooms/{roomId}/messages, /sub/chat-rooms/{roomId}/read, /sub/chat-rooms/{roomId}/calls, /user/sub/errors
 */
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_BASE_URL } from '../auth/authApi.js'
import { getAccessToken } from '../auth/tokenStore.js'

const SOCKJS_URL = `${API_BASE_URL}/ws-stomp`

let client = null
let connectPromise = null
const statusListeners = new Set()

function notifyStatus(status) {
  statusListeners.forEach((cb) => {
    try {
      cb(status)
    } catch (e) {
      console.warn('[chat] status listener 오류', e)
    }
  })
}

/** 연결 상태('connected' | 'disconnected' | 'error') 변화를 구독합니다. */
export function onSocketStatus(cb) {
  statusListeners.add(cb)
  return () => statusListeners.delete(cb)
}

function createClient() {
  const c = new Client({
    // SockJS 팩토리. (브라우저 호환 위해 서버가 SockJS만 등록함)
    webSocketFactory: () => new SockJS(SOCKJS_URL),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // 매 (재)연결 직전에 최신 토큰으로 CONNECT 헤더를 갱신한다.
    beforeConnect: () => {
      const token = getAccessToken()
      c.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
    },
    onConnect: () => notifyStatus('connected'),
    onWebSocketClose: () => notifyStatus('disconnected'),
    onStompError: handleStompError,
  })
  return c
}

function handleStompError(frame) {
  console.error('[chat] STOMP error:', frame?.headers?.message, frame?.body)
  notifyStatus('error')
}

/** 연결을 보장합니다. 토큰이 없으면 거부. 이미 활성화돼 있으면 기존 연결을 재사용. */
export function connectChat() {
  if (!getAccessToken()) return Promise.reject(new Error('NO_TOKEN'))
  if (client && client.connected) return Promise.resolve(client)
  if (connectPromise) return connectPromise

  client = client || createClient()
  const baseOnConnect = client.onConnect
  const baseOnStompError = client.onStompError
  const baseOnWebSocketClose = client.onWebSocketClose

  connectPromise = new Promise((resolve, reject) => {
    let settled = false

    const failConnect = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    client.onConnect = (frame) => {
      baseOnConnect?.(frame)
      settled = true
      resolve(client)
    }
    client.onStompError = (frame) => {
      baseOnStompError?.(frame)
      failConnect(new Error(frame?.headers?.message || 'STOMP_ERROR'))
    }
    client.onWebSocketClose = (event) => {
      baseOnWebSocketClose?.(event)
      failConnect(new Error('SOCKET_CLOSED'))
    }
    client.activate()
  }).finally(() => {
    if (client) {
      client.onConnect = baseOnConnect
      client.onStompError = baseOnStompError
      client.onWebSocketClose = baseOnWebSocketClose
    }
    connectPromise = null
  })
  return connectPromise
}

/** 연결을 완전히 종료합니다(로그아웃 등). */
export function disconnectChat() {
  if (client) {
    client.deactivate()
    client = null
    connectPromise = null
    notifyStatus('disconnected')
  }
}

/**
 * 특정 방의 메시지/읽음 토픽을 구독합니다.
 * @returns 구독 해제 함수
 */
export function subscribeRoom(roomId, { onMessage, onRead } = {}) {
  if (!client || !client.connected) return () => {}
  const subs = []
  if (onMessage) {
    subs.push(
      client.subscribe(`/sub/chat-rooms/${roomId}/messages`, (frame) => {
        try {
          onMessage(JSON.parse(frame.body))
        } catch (e) {
          console.error('[chat] 메시지 파싱 실패', e)
        }
      }),
    )
  }
  if (onRead) {
    subs.push(
      client.subscribe(`/sub/chat-rooms/${roomId}/read`, (frame) => {
        try {
          onRead(JSON.parse(frame.body))
        } catch (e) {
          console.error('[chat] 읽음 파싱 실패', e)
        }
      }),
    )
  }
  return () => subs.forEach((s) => {
    try {
      s.unsubscribe()
    } catch {
      /* 이미 해제됨 */
    }
  })
}

/**
 * 특정 방의 보이스톡 WebRTC 신호 토픽을 구독합니다.
 * @returns 구독 해제 함수
 */
export function subscribeRoomCalls(roomId, onCallSignal) {
  if (!client || !client.connected || !onCallSignal) return () => {}
  const sub = client.subscribe(`/sub/chat-rooms/${roomId}/calls`, (frame) => {
    try {
      onCallSignal(JSON.parse(frame.body))
    } catch (e) {
      console.error('[chat] 보이스톡 신호 파싱 실패', e)
    }
  })
  return () => {
    try {
      sub.unsubscribe()
    } catch {
      /* already unsubscribed */
    }
  }
}

/** 내 개인 에러 큐(/user/sub/errors) 구독. */
export function subscribeErrors(onError) {
  if (!client || !client.connected || !onError) return () => {}
  const sub = client.subscribe('/user/sub/errors', (frame) => {
    try {
      onError(JSON.parse(frame.body))
    } catch (e) {
      console.error('[chat] 에러 파싱 실패', e)
    }
  })
  return () => {
    try {
      sub.unsubscribe()
    } catch {
      /* noop */
    }
  }
}

/** 메시지 전송(/pub/chat-rooms/{roomId}/messages). 연결돼 있지 않으면 false. */
export function sendChatMessage(roomId, { messageType = 'TEXT', content = '', fileIds = null }) {
  if (!client || !client.connected) return false
  client.publish({
    destination: `/pub/chat-rooms/${roomId}/messages`,
    body: JSON.stringify({ messageType, content, fileIds }),
  })
  return true
}

/** 읽음 처리 전송(/pub/chat-rooms/{roomId}/read). */
export function sendReadReceipt(roomId, lastReadMessageId) {
  if (!client || !client.connected || lastReadMessageId == null) return
  client.publish({
    destination: `/pub/chat-rooms/${roomId}/read`,
    body: JSON.stringify({ lastReadMessageId }),
  })
}

/** 보이스톡 WebRTC 신호 전송(/pub/chat-rooms/{roomId}/calls). */
export function sendCallSignal(roomId, signal) {
  if (!client || !client.connected || roomId == null) return false
  client.publish({
    destination: `/pub/chat-rooms/${roomId}/calls`,
    body: JSON.stringify(signal),
  })
  return true
}
