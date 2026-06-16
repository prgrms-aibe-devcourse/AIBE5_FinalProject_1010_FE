/**
 * @file FocusedVideoView.jsx
 * @description 특정 참가자의 카메라를 보드 중앙에 크게 표시(더블클릭으로 진입).
 * - 트랙을 <video>에 attach(objectFit: contain). 오버레이/✕ 클릭으로 닫는다.
 * - 카메라가 꺼져 있으면 이니셜 아바타를 크게 보여준다.
 */
import { useEffect, useRef } from 'react'

export default function FocusedVideoView({ tile, onClose }) {
  const videoRef = useRef(null)
  const track = tile?.camTrack

  useEffect(() => {
    const el = videoRef.current
    if (!el || !track) return undefined
    track.attach(el)
    return () => { track.detach(el) }
  }, [track])

  const initial = (tile?.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div onClick={onClose} title="클릭하면 닫기"
      style={{ position: 'absolute', inset: 0, zIndex: 7, background: '#0b0b0c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
      {track ? (
        <video ref={videoRef} autoPlay playsInline muted={tile.isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'contain', transform: tile.isLocal ? 'scaleX(-1)' : 'none' }} />
      ) : (
        <div style={{ width: 160, height: 160, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#f59e0b,#b45309)' }}>
          {initial}
        </div>
      )}
      <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
        <span>{tile?.micEnabled ? '🎙️' : '🔇'}</span>
        <span>{tile?.name}{tile?.isLocal ? ' (나)' : ''}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose?.() }} title="닫기"
        style={{ position: 'absolute', top: 10, right: 12, width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
    </div>
  )
}
