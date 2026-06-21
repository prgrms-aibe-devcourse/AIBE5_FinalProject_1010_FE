/**
 * @file ClassroomAudioPlayer.jsx
 * @description 강의실 공용 오디오 플레이어 UI (이슈 #117). 보드 상단 중앙에 떠 있는 바.
 * - 선생님(host): 재생/일시정지/정지 + 진행바 드래그(탐색). 동작은 동기화되어 학생도 같은 위치로.
 * - 학생: 읽기 전용 진행 표시 + 상태. 자동재생이 막히면 "재생 허용" 버튼으로 1회 제스처.
 * - 볼륨은 각자 로컬 설정(동기화 안 함).
 * 트랙이 없으면 아무것도 렌더하지 않는다.
 */
function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const iconBtn = (enabled = true) => ({
  border: 'none', background: 'transparent', cursor: enabled ? 'pointer' : 'default',
  opacity: enabled ? 1 : 0.4, fontSize: 18, lineHeight: 1, padding: '2px 4px', color: '#0e7490',
})

export default function ClassroomAudioPlayer({ audio, isHost }) {
  const { track, playing, currentTime, duration, needGesture, volume, play, pause, stop, seek, setVolume, allowPlayback } = audio
  if (!track) return null
  const max = duration > 0 ? duration : Math.max(currentTime, 1)
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 8, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '6px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13, maxWidth: 'min(92vw, 560px)' }}>
      <span title={track.fileName || '오디오'} style={{ fontWeight: 800, color: '#0e7490', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
        🎧 {track.fileName || '오디오'}
      </span>

      {isHost ? (
        <>
          <button onClick={playing ? pause : play} title={playing ? '일시정지' : '재생'} style={iconBtn(true)}>{playing ? '⏸' : '▶'}</button>
          <button onClick={stop} title="정지(처음으로)" style={iconBtn(true)}>⏹</button>
          <input
            type="range" min={0} max={max} step="0.1"
            value={Math.min(currentTime, max)}
            onChange={(e) => seek(Number(e.target.value))}
            title="탐색(전원 동기화)"
            style={{ flex: 1, minWidth: 120, accentColor: '#06b6d4' }}
          />
        </>
      ) : (
        <>
          <span style={{ flex: '0 0 auto', color: playing ? '#0e7490' : '#6b7280', fontWeight: 700 }}>{playing ? '▶ 재생중' : '⏸ 멈춤'}</span>
          <div style={{ flex: 1, minWidth: 120, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#06b6d4' }} />
          </div>
        </>
      )}

      <span style={{ color: '#6b7280', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{fmt(currentTime)} / {fmt(duration)}</span>

      <span title="볼륨(내 화면에서만)" style={{ display: 'flex', alignItems: 'center', gap: 3, flex: '0 0 auto' }}>
        🔉
        <input type="range" min={0} max={1} step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ width: 56, accentColor: '#06b6d4' }} />
      </span>

      {needGesture && (
        <button onClick={allowPlayback} title="브라우저 자동재생 제한 해제" style={{ flex: '0 0 auto', border: '1px solid #06b6d4', background: '#ecfeff', color: '#0e7490', borderRadius: 999, height: 26, padding: '0 10px', cursor: 'pointer', fontWeight: 800, whiteSpace: 'nowrap' }}>
          🔊 재생 허용
        </button>
      )}
    </div>
  )
}
