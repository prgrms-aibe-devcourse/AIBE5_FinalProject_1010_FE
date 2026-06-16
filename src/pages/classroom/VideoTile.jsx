/**
 * @file VideoTile.jsx
 * @description 참가자 1명의 화상 타일. LiveKit 트랙을 <video>/<audio> 요소에 attach/detach 한다.
 * - 카메라 트랙이 없으면(끔/미송출) 이니셜 아바타를 보여준다.
 * - 내 타일은 비디오를 음소거(muted)해 에코를 막는다. 원격은 마이크 트랙을 붙여 소리를 낸다.
 * - 기존 .p-orb 스타일을 재사용한다.
 */
import { useEffect, useRef } from 'react'

export default function VideoTile({ tile, collapsed, onSingleClick, onDoubleClick }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const clickTimer = useRef(null)

  // 한 번 클릭 vs 더블클릭 구분(브라우저가 더블클릭 때 click도 쏘므로 220ms 지연으로 분기)
  const handleClick = () => {
    if (clickTimer.current) return
    clickTimer.current = setTimeout(() => { clickTimer.current = null; onSingleClick?.() }, 220)
  }
  const handleDoubleClick = () => {
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null }
    onDoubleClick?.()
  }
  // 언마운트 시 대기 중인 클릭 타이머 정리(만료되며 onSingleClick이 호출돼 경고 나는 것 방지)
  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current) }, [])

  // 오브(작은 동그라미)는 항상 카메라만 — 화면공유는 중앙 큰 뷰(ScreenShareView)에서 따로 표시
  const videoTrack = tile.camTrack
  useEffect(() => {
    const el = videoRef.current
    if (!el || !videoTrack) return undefined
    videoTrack.attach(el)
    return () => { videoTrack.detach(el) }
  }, [videoTrack])

  // 원격 마이크 트랙 attach(소리)
  useEffect(() => {
    const el = audioRef.current
    if (!el || !tile.micTrack) return undefined
    tile.micTrack.attach(el)
    return () => { tile.micTrack.detach(el) }
  }, [tile.micTrack])

  const initial = (tile.name || '?').trim().charAt(0).toUpperCase()
  const hasVideo = !!videoTrack

  return (
    <div className={`p-orb ${collapsed ? 'collapsed' : ''}`} onClick={handleClick} onDoubleClick={handleDoubleClick}
      title="클릭: 작게/크게 · 더블클릭: 전체화면"
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', outline: tile.speaking ? '3px solid #22c55e' : 'none' }}>
      {/* 비디오 (없으면 숨기고 아바타 표시) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={tile.isLocal}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: hasVideo ? 'block' : 'none', transform: tile.isLocal ? 'scaleX(-1)' : 'none' }}
      />
      {!hasVideo && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#f59e0b,#b45309)' }}>
          {initial}
        </div>
      )}

      {/* 원격 오디오 (보이지 않음) */}
      {tile.micTrack && <audio ref={audioRef} autoPlay />}

      {/* 이름 + 마이크 상태 */}
      {!collapsed && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
          <span>{tile.micEnabled ? '🎙️' : '🔇'}</span>
          <span>{tile.name}{tile.isLocal ? ' (나)' : ''}</span>
        </div>
      )}
    </div>
  )
}
