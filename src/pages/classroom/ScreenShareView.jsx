/**
 * @file ScreenShareView.jsx
 * @description 현재 공유 중인 화면을 강의실 중앙에 크게 표시한다(보드 영역 위 오버레이).
 * - 동시에 한 명만 공유하므로 항상 1개만 렌더된다.
 * - 트랙을 <video>에 attach(objectFit: contain)하고, 공유자 이름을 라벨로 보여준다.
 */
import { useEffect, useRef } from 'react'

export default function ScreenShareView({ share }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !share?.track) return undefined
    share.track.attach(el)
    return () => { share.track.detach(el) }
  }, [share?.track])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: '#0b0b0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} autoPlay playsInline muted={share?.isLocal}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
        <span>🖥️</span>
        <span>{share?.name}{share?.isLocal ? ' (나)' : ''} 님이 화면 공유 중</span>
      </div>
    </div>
  )
}
