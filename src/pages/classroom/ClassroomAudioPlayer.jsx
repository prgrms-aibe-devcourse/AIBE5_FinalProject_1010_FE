/**
 * @file ClassroomAudioPlayer.jsx
 * @description 강의실 공용 오디오 플레이어 (이슈 #117). 듣기 수업용 고급 플레이어.
 * - 자유 이동(헤더 드래그) · 열고/닫기(접기) — 로컬.
 * - 선생님(host): 재생/일시정지/정지, 진행바 탐색, mm:ss 정밀 탐색, 배속 0.2~3x(−/+), AB 반복구간(정밀 입력),
 *   재생목록(클릭 선택/삭제). 모든 제어는 동기화되어 학생도 동일 상태/위치로.
 * - 학생: 읽기 전용(상태·진행·배속·반복 표시) + 자동재생 차단 시 "재생 허용". 볼륨은 각자 로컬.
 * - 트랙도 재생목록도 없으면 렌더하지 않는다.
 */
import { useEffect, useRef, useState } from 'react'
import { MIN_RATE, MAX_RATE } from './useClassroomAudio.js'

const RATE_STEP = 0.1

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
/** "mm:ss" / "m:ss" / "ss(.s)" → 초. 잘못된 값이면 null. */
function parseTime(str) {
  if (str == null) return null
  const s = String(str).trim()
  if (s === '') return null
  if (s.includes(':')) {
    const [m, sec] = s.split(':')
    const mm = Number(m), ss = Number(sec)
    if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null
    return Math.max(0, mm * 60 + ss)
  }
  const n = Number(s)
  return Number.isFinite(n) ? Math.max(0, n) : null
}

const miniBtn = (enabled = true, color = '#0e7490') => ({
  border: '1px solid #cbd5e1', background: '#fff', color, borderRadius: 6, minWidth: 26, height: 24,
  cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.4, fontWeight: 800, fontSize: 13, padding: '0 6px',
})
const timeInput = { width: 52, height: 24, border: '1px solid #cbd5e1', borderRadius: 6, padding: '0 4px', textAlign: 'center', fontSize: 12 }
const stop = (e) => e.stopPropagation()

export default function ClassroomAudioPlayer({ audio, isHost }) {
  const {
    playlist, track, playing, currentTime, duration, rate, loop, needGesture, volume,
    play, pause, stop: stopAudio, seek, changeRate, setLoopRegion, selectTrack, removeTrack, allowPlayback, setVolume,
  } = audio

  const [open, setOpen] = useState(true)
  const [pos, setPos] = useState(null)              // {left, top} 드래그 위치(null=상단 중앙 기본)
  const [seekText, setSeekText] = useState('')
  const [aText, setAText] = useState('')
  const [bText, setBText] = useState('')
  const aFocus = useRef(false), bFocus = useRef(false)
  const rootRef = useRef(null)

  // 동기화된 반복 구간 → 입력칸 반영(포커스 중엔 건드리지 않음)
  useEffect(() => { if (!aFocus.current) setAText(loop.start ? fmt(loop.start) : '') }, [loop.start])
  useEffect(() => { if (!bFocus.current) setBText(loop.end ? fmt(loop.end) : '') }, [loop.end])

  // 헤더 드래그 이동 (board 영역 안으로 제한)
  const onHeaderDown = (e) => {
    if (e.target.closest('button, input')) return
    const el = rootRef.current
    if (!el) return
    e.preventDefault()
    const parent = el.offsetParent
    const start = { sx: e.clientX, sy: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      let left = start.left + (ev.clientX - start.sx)
      let top = start.top + (ev.clientY - start.sy)
      if (parent) {
        left = Math.max(0, Math.min(left, parent.clientWidth - el.offsetWidth))
        top = Math.max(0, Math.min(top, parent.clientHeight - el.offsetHeight))
      }
      setPos({ left, top })
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (!track && (!playlist || playlist.length === 0)) return null

  const max = duration > 0 ? duration : Math.max(currentTime, 1)
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const posStyle = pos
    ? { left: pos.left, top: pos.top }
    : { left: '50%', top: 12, transform: 'translateX(-50%)' }

  const commitSeek = () => { const t = parseTime(seekText); if (t != null) seek(t); setSeekText('') }
  const commitLoop = (on) => {
    const a = parseTime(aText) ?? loop.start
    const b = parseTime(bText) ?? loop.end
    setLoopRegion(on, a, b)
  }

  return (
    <div ref={rootRef} onPointerDown={stop} style={{ position: 'absolute', zIndex: 9, width: 340, maxWidth: '92vw', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.16)', fontSize: 12, ...posStyle }}>
      {/* 헤더 (드래그 핸들 + 접기) */}
      <div onPointerDown={onHeaderDown} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', cursor: 'move', background: '#ecfeff', borderRadius: '12px 12px 0 0', borderBottom: open ? '1px solid #e5e7eb' : 'none' }}>
        <span style={{ fontWeight: 800, color: '#0e7490', flex: '0 0 auto' }}>🎧 듣기 자료</span>
        <span title={track?.fileName} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155', fontWeight: 700 }}>
          {track?.fileName || '재생목록에서 선택'}
        </span>
        <button onClick={() => setOpen((o) => !o)} title={open ? '접기' : '펼치기'} style={miniBtn(true)}>{open ? '▾' : '▸'}</button>
      </div>

      {open && (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {track && (
            <>
              {/* 트랜스포트 + 진행 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isHost ? (
                  <>
                    <button onClick={playing ? pause : play} title={playing ? '일시정지' : '재생'} style={miniBtn(true)}>{playing ? '⏸' : '▶'}</button>
                    <button onClick={stopAudio} title="정지(처음으로)" style={miniBtn(true)}>⏹</button>
                    <input type="range" min={0} max={max} step="0.1" value={Math.min(currentTime, max)} onChange={(e) => seek(Number(e.target.value))} style={{ flex: 1, accentColor: '#06b6d4' }} />
                  </>
                ) : (
                  <>
                    <span style={{ flex: '0 0 auto', fontWeight: 800, color: playing ? '#0e7490' : '#64748b' }}>{playing ? '▶' : '⏸'}</span>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#06b6d4' }} />
                    </div>
                  </>
                )}
                <span style={{ color: '#64748b', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{fmt(currentTime)}/{fmt(duration)}</span>
              </div>

              {/* 정밀 탐색(mm:ss) — 선생님 */}
              {isHost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#64748b', flex: '0 0 auto' }}>이동</span>
                  <input value={seekText} onChange={(e) => setSeekText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') commitSeek() }} placeholder="mm:ss" style={timeInput} />
                  <button onClick={commitSeek} style={miniBtn(true)}>↪ 이동</button>
                  {/* 배속 */}
                  <span style={{ marginLeft: 'auto', color: '#64748b', flex: '0 0 auto' }}>배속</span>
                  <button onClick={() => changeRate(rate - RATE_STEP)} disabled={rate <= MIN_RATE} title="느리게" style={miniBtn(rate > MIN_RATE)}>−</button>
                  <button onClick={() => changeRate(1)} title="1배속" style={{ ...miniBtn(true), minWidth: 44 }}>{rate.toFixed(2)}x</button>
                  <button onClick={() => changeRate(rate + RATE_STEP)} disabled={rate >= MAX_RATE} title="빠르게" style={miniBtn(rate < MAX_RATE)}>+</button>
                </div>
              )}
              {!isHost && (
                <div style={{ color: '#64748b' }}>배속 <b style={{ color: '#0e7490' }}>{rate.toFixed(2)}x</b>{loop.on && <> · 🔁 {fmt(loop.start)}~{fmt(loop.end)}</>}</div>
              )}

              {/* AB 반복 — 선생님 */}
              {isHost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => commitLoop(!loop.on)} title="AB 반복 켜기/끄기" style={{ ...miniBtn(true), background: loop.on ? '#cffafe' : '#fff', minWidth: 64 }}>🔁 {loop.on ? 'ON' : 'OFF'}</button>
                  <span style={{ color: '#64748b' }}>A</span>
                  <input value={aText} onFocus={() => { aFocus.current = true }} onBlur={() => { aFocus.current = false; commitLoop(loop.on) }} onChange={(e) => setAText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') commitLoop(loop.on) }} placeholder="mm:ss" style={timeInput} />
                  <button onClick={() => { setAText(fmt(currentTime)); setLoopRegion(loop.on, currentTime, parseTime(bText) ?? loop.end) }} title="현재 위치를 A로" style={miniBtn(true)}>현재</button>
                  <span style={{ color: '#64748b' }}>B</span>
                  <input value={bText} onFocus={() => { bFocus.current = true }} onBlur={() => { bFocus.current = false; commitLoop(loop.on) }} onChange={(e) => setBText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') commitLoop(loop.on) }} placeholder="mm:ss" style={timeInput} />
                  <button onClick={() => { setBText(fmt(currentTime)); setLoopRegion(loop.on, parseTime(aText) ?? loop.start, currentTime) }} title="현재 위치를 B로" style={miniBtn(true)}>현재</button>
                </div>
              )}

              {/* 볼륨(로컬) + 자동재생 허용 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span title="볼륨(내 화면에서만)" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  🔉<input type="range" min={0} max={1} step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ flex: 1, accentColor: '#06b6d4' }} />
                </span>
                {needGesture && <button onClick={allowPlayback} style={{ ...miniBtn(true), background: '#ecfeff', border: '1px solid #06b6d4' }}>🔊 재생 허용</button>}
              </div>
            </>
          )}

          {/* 재생목록 */}
          {playlist.length > 0 && (
            <div style={{ borderTop: track ? '1px solid #f1f5f9' : 'none', paddingTop: track ? 6 : 0 }}>
              <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>재생목록 ({playlist.length})</div>
              <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {playlist.map((t) => {
                  const active = t.fileId === track?.fileId
                  return (
                    <div key={t.fileId ?? t.url} style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6, background: active ? '#ecfeff' : 'transparent' }}>
                      <button
                        onClick={() => { if (isHost && !active) selectTrack(t.fileId) }}
                        title={t.fileName}
                        disabled={!isHost}
                        style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', cursor: isHost ? 'pointer' : 'default', padding: '5px 7px', fontWeight: active ? 800 : 600, color: active ? '#0e7490' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 6 }}
                      >
                        {active ? '▶ ' : '🎵 '}{t.fileName || '오디오'}
                      </button>
                      {isHost && (
                        <button onClick={() => { if (window.confirm(`'${t.fileName || '오디오'}'를 목록에서 삭제할까요?`)) removeTrack(t.fileId) }} title="삭제" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#b91c1c', fontSize: 13, padding: '4px 7px', flex: '0 0 auto' }}>🗑</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
