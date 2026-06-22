/**
 * @file room/useReactions.js
 * @description 떠오르는 리액션(손흔들기/좋아요) 오버레이 상태. 수신 메시지를 3초 떠오르는 항목으로 쌓고 자동 소멸.
 */
import { useEffect, useRef, useState } from 'react'

export function useReactions() {
  const [reactions, setReactions] = useState([]) // [{ key, emoji, name }]
  const seq = useRef(0)
  const timers = useRef([])

  const pushReaction = (msg) => {
    const key = ++seq.current
    const emoji = msg?.type === 'hand' ? '✋' : '👍'
    setReactions((prev) => [...prev, { key, emoji, name: msg?.senderName || '' }])
    const t = setTimeout(() => setReactions((prev) => prev.filter((r) => r.key !== key)), 3000)
    timers.current.push(t)
  }

  // 언마운트 시 남은 타이머 정리(언마운트 후 setState 경고 방지)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return { reactions, pushReaction }
}
