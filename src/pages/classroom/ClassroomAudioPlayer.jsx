/**
 * @file ClassroomAudioPlayer.jsx
 * @description 강의실 공용 오디오 플레이어 (이슈 #117). 듣기 수업용 고급 플레이어.
 * - 자유 이동(헤더 드래그) · 열고/닫기(접기) — 로컬.
 * - 선생님(host): 재생/정지, 진행바 탐색, hh:mm:ss 정밀 이동, 배속 0.2~3x(−/+),
 *   AB 반복(시작<끝 검증·구간 재생 버튼), 재생목록(클릭 선택/삭제). 모든 제어는 동기화.
 * - 학생: 읽기 전용(상태·진행·배속·반복 표시) + 자동재생 차단 시 "재생 허용". 볼륨은 로컬.
 * - 반복 구간은 진행바에 노란 밴드 + 칩으로 표시(모두에게).
 */
import { useEffect, useRef, useState } from 'react'
import { MIN_RATE, MAX_RATE } from './useClassroomAudio.js'

const RATE_STEP = 0.1
const LOOP_BAND = 'rgba(245, 158, 11, 0.35)' // 반복 구간 표시색(앰버)

function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}
/** "hh:mm:ss" / "mm:ss" / "ss(.s)" → 초. 잘못된 값이면 null. */
function parseTime(str) {
  if (str == null) return null
  const s = String(str).trim()
  if (s === '') return null
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => Number(p))
    if (parts.some((n) => !Number.isFinite(n))) return null
    let sec = 0
    for (const p of parts) sec = sec * 60 + p   // h:m:s 또는 m:s 모두 지원
    return Math.max(0, sec)
  }
  const n = Number(s)
  return Number.isFinite(n) ? Math.max(0, n) : null
}

const miniBtn = (enabled = true, color = '#0e7490') => ({
  border: '1px solid #cbd5e1', background: '#fff', color, borderRadius: 6, minWidth: 26, height: 24,
  cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.4, fontWeight: 800, fontSize: 13, padding: '0 6px',
})
const timeInput = (bad) => ({ width: 64, height: 24, border: `1px solid ${bad ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, padding: '0 4px', textAlign: 'center', fontSize: 12 })
const stop = (e) => e.stopPropagation()

/** 진행바 + 반복 구간 밴드. host면 드래그 탐색 가능, 아니면 읽기 전용. */
function ProgressBar({ isHost, currentTime, duration, loop, onSeek }) {
  const max = duration > 0 ? duration : Math.max(currentTime, 1)
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const showBand = loop.on && duration > 0 && loop.end > loop.start
  const bandLeft = showBand ? Math.max(0, Math.min(100, (loop.start / duration) * 100)) : 0
  const bandWidth = showBand ? Math.max(0, Math.min(100 - bandLeft, ((loop.end - loop.start) / duration) * 100)) : 0
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 120, display: 'flex', alignItems: 'center' }}>
      {showBand && <div style={{ position: 'absolute', left: `${bandLeft}%`, width: `${bandWidth}%`, top: '50%', transform: 'translateY(-50%)', height: 8, background: LOOP_BAND, borderRadius: 2, pointerEvents: 'none', zIndex: 0 }} />}
      {isHost ? (
        <input type="range" min={0} max={max} step="0.1" value={Math.min(currentTime, max)} onChange={(e) => onSeek(Number(e.target.value))} style={{ position: 'relative', zIndex: 1, width: '100%', accentColor: '#06b6d4', background: 'transparent' }} />
      ) : (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#06b6d4' }} />
        </div>
      )}
    </div>
  )
}

export default function ClassroomAudioPlayer({ audio, isHost }) {
  const {
    playlist, track, playing, currentTime, duration, rate, loop, needGesture, volume,
    play, playFrom, pause, stop: stopAudio, seek, changeRate, setLoopRegion, selectTrack, removeTrack, allowPlayback, setVolume,
  } = audio

  const [open, setOpen] = useState(true)
  const [pos, setPos] = useState(null)
  const [seekText, setSeekText] = useState('')
  const [aText, setAText] = useState('')
  const [bText, setBText] = useState('')
  const [loopErr, setLoopErr] = useState('')
  const aFocus = useRef(false), bFocus = useRef(false)
  const rootRef = useRef(null)

  useEffect(() => { if (!aFocus.current) setAText(loop.start ? fmt(loop.start) : '') }, [loop.start])
  useEffect(() => { if (!bFocus.current) setBText(loop.end ? fmt(loop.end) : '') }, [loop.end])

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

  const posStyle = pos ? { left: pos.left, top: pos.top } : { left: '50%', top: 12, transform: 'translateX(-50%)' }
  const commitSeek = () => { const t = parseTime(seekText); if (t != null) seek(t); setSeekText('') }

  // AB 반복: 시작(A) < 끝(B) 검증 후 적용.
  const applyLoop = (on) => {
    const a = parseTime(aText), b = parseTime(bText)
    if (on) {
      if (a == null || b == null || b <= a) { setLoopErr('시작(A)은 끝(B)보다 앞서야 해요'); return false }
      setLoopErr(''); setLoopRegion(true, a, b); return true
    }
    setLoopErr(''); setLoopRegion(false, a || 0, b || 0); return true
  }
  const onEditA = (commit) => { if (commit && loop.on) applyLoop(true) }
  const onEditB = (commit) => { if (commit && loop.on) applyLoop(true) }
  const setAnow = () => { setAText(fmt(currentTime)); if (loop.on) { const b = parseTime(bText); if (b != null && b > currentTime) { setLoopErr(''); setLoopRegion(true, currentTime, b) } else setLoopErr('시작(A)은 끝(B)보다 앞서야 해요') } }
  const setBnow = () => { setBText(fmt(currentTime)); if (loop.on) { const a = parseTime(aText); if (a != null && currentTime > a) { setLoopErr(''); setLoopRegion(true, a, currentTime) } else setLoopErr('시작(A)은 끝(B)보다 앞서야 해요') } }
  const playLoop = () => {
    const a = parseTime(aText), b = parseTime(bText)
    if (a == null || b == null || b <= a) { setLoopErr('시작(A)은 끝(B)보다 앞서야 해요'); return }
    setLoopErr(''); setLoopRegion(true, a, b); playFrom(a)
  }

  return (
    <div ref={rootRef} onPointerDown={stop} style={{ position: 'absolute', zIndex: 9, width: 360, maxWidth: '92vw', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.16)', fontSize: 12, ...posStyle }}>
      {/* 헤더 (드래그 + 접기) */}
      <div onPointerDown={onHeaderDown} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', cursor: 'move', background: '#ecfeff', borderRadius: '12px 12px 0 0', borderBottom: open ? '1px solid #e5e7eb' : 'none' }}>
        <span style={{ fontWeight: 800, color: '#0e7490', flex: '0 0 auto' }}>🎧 듣기 자료</span>
        {loop.on && loop.end > loop.start && (
          <span title="반복 구간" style={{ flex: '0 0 auto', background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '1px 8px', fontWeight: 800, fontSize: 11 }}>🔁 {fmt(loop.start)}~{fmt(loop.end)}</span>
        )}
        <span title={track?.fileName} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155', fontWeight: 700 }}>{track?.fileName || '재생목록에서 선택'}</span>
        <button onClick={() => setOpen((o) => !o)} title={open ? '접기' : '펼치기'} style={miniBtn(true)}>{open ? '▾' : '▸'}</button>
      </div>

      {open && (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {track && (
            <>
              {/* 트랜스포트 + 진행(반복 밴드 포함) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isHost ? (
                  <>
                    <button onClick={playing ? pause : play} title={playing ? '일시정지' : '재생'} style={miniBtn(true)}>{playing ? '⏸' : '▶'}</button>
                    <button onClick={stopAudio} title="정지(처음으로)" style={miniBtn(true)}>⏹</button>
                  </>
                ) : (
                  <span style={{ flex: '0 0 auto', fontWeight: 800, color: playing ? '#0e7490' : '#64748b' }}>{playing ? '▶' : '⏸'}</span>
                )}
                <ProgressBar isHost={isHost} currentTime={currentTime} duration={duration} loop={loop} onSeek={seek} />
                <span style={{ color: '#64748b', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{fmt(currentTime)}/{fmt(duration)}</span>
              </div>

              {isHost && (
                <>
                  {/* 정밀 이동 + 배속 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#64748b', flex: '0 0 auto' }}>이동</span>
                    <input value={seekText} onChange={(e) => setSeekText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') commitSeek() }} placeholder="h:mm:ss" style={timeInput(false)} />
                    <button onClick={commitSeek} style={miniBtn(true)}>↪</button>
                    <span style={{ marginLeft: 'auto', color: '#64748b', flex: '0 0 auto' }}>배속</span>
                    <button onClick={() => changeRate(rate - RATE_STEP)} disabled={rate <= MIN_RATE} title="느리게" style={miniBtn(rate > MIN_RATE)}>−</button>
                    <button onClick={() => changeRate(1)} title="1배속" style={{ ...miniBtn(true), minWidth: 44 }}>{rate.toFixed(2)}x</button>
                    <button onClick={() => changeRate(rate + RATE_STEP)} disabled={rate >= MAX_RATE} title="빠르게" style={miniBtn(rate < MAX_RATE)}>+</button>
                  </div>

                  {/* AB 반복 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => applyLoop(!loop.on)} title="AB 반복 켜기/끄기" style={{ ...miniBtn(true), background: loop.on ? '#fef3c7' : '#fff', borderColor: loop.on ? '#f59e0b' : '#cbd5e1', color: loop.on ? '#92400e' : '#0e7490', minWidth: 70 }}>🔁 {loop.on ? 'ON' : 'OFF'}</button>
                    <span style={{ color: '#64748b' }}>A</span>
                    <input value={aText} onFocus={() => { aFocus.current = true }} onBlur={() => { aFocus.current = false; onEditA(true) }} onChange={(e) => setAText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') onEditA(true) }} placeholder="0:00" style={timeInput(!!loopErr)} />
                    <button onClick={setAnow} title="현재 위치를 A로" style={miniBtn(true)}>현재</button>
                    <span style={{ color: '#64748b' }}>B</span>
                    <input value={bText} onFocus={() => { bFocus.current = true }} onBlur={() => { bFocus.current = false; onEditB(true) }} onChange={(e) => setBText(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') onEditB(true) }} placeholder="0:00" style={timeInput(!!loopErr)} />
                    <button onClick={setBnow} title="현재 위치를 B로" style={miniBtn(true)}>현재</button>
                    <button onClick={playLoop} title="구간 처음부터 반복 재생" style={{ ...miniBtn(true), background: '#ecfeff', borderColor: '#06b6d4' }}>🔁▶ 구간재생</button>
                  </div>
                  {loopErr && <div style={{ color: '#ef4444', fontWeight: 700 }}>⚠ {loopErr}</div>}
                </>
              )}
              {!isHost && (
                <div style={{ color: '#64748b' }}>배속 <b style={{ color: '#0e7490' }}>{rate.toFixed(2)}x</b>{loop.on && loop.end > loop.start && <> · <b style={{ color: '#92400e' }}>🔁 {fmt(loop.start)}~{fmt(loop.end)} 반복중</b></>}</div>
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
                      <button onClick={() => { if (isHost && !active) selectTrack(t.fileId) }} title={t.fileName} disabled={!isHost} style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', cursor: isHost ? 'pointer' : 'default', padding: '5px 7px', fontWeight: active ? 800 : 600, color: active ? '#0e7490' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 6 }}>
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
