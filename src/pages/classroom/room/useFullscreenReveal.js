/**
 * @file room/useFullscreenReveal.js
 * @description 강의실 전체화면 + 가장자리 호버 시 좌측 도구바/하단 컨트롤 슬라이드 노출.
 * 전체화면일 땐 도구바/컨트롤을 떠 있는(fixed) 오버레이로 만들어 보드가 꽉 차게 한다.
 */
import { useEffect, useState } from 'react'

export function useFullscreenReveal(rootRef, { chatOpen = false } = {}) {
  const [isFs, setIsFs] = useState(false)
  const [revealLeft, setRevealLeft] = useState(false)
  const [revealBottom, setRevealBottom] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.()
  }
  const onRootMouseMove = (e) => {
    if (!isFs) return
    setRevealLeft(e.clientX < 90)                          // 좌측 가장자리
    setRevealBottom(e.clientY > window.innerHeight - 110)  // 하단 가장자리
  }

  const fsAsideStyle = isFs
    ? { position: 'fixed', left: 16, top: 16, bottom: 16, zIndex: 60, transition: 'transform .2s ease', transform: revealLeft ? 'none' : 'translateX(-130%)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }
    : undefined
  const fsBottomStyle = isFs
    ? { position: 'fixed', left: 16, right: chatOpen ? 372 : 16, bottom: 16, zIndex: 60, transition: 'transform .2s ease', transform: revealBottom ? 'none' : 'translateY(160%)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--soft-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }
    : undefined

  return { isFs, toggleFullscreen, onRootMouseMove, fsAsideStyle, fsBottomStyle }
}
