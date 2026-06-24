import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 메시지를 일정 시간(기본 3.5초) 동안만 표시하고 자동으로 지우는 훅입니다.
 * @param {number} durationMs - 메시지 표시 시간 (밀리초)
 * @returns {[string, function, function]} [notice, showNotice, clearNotice]
 */
export default function useNotice(durationMs = 3500) {
  const [notice, setNoticeRaw] = useState('')
  const timerRef = useRef(null)

  const showNotice = useCallback((msg) => {
    clearTimeout(timerRef.current)
    setNoticeRaw(msg)
    timerRef.current = setTimeout(() => {
      setNoticeRaw('')
    }, durationMs)
  }, [durationMs])

  const clearNotice = useCallback(() => {
    clearTimeout(timerRef.current)
    setNoticeRaw('')
  }, [])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return [notice, showNotice, clearNotice]
}
