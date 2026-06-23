/**
 * @file LivePreviewModal.jsx
 * @description "실시간 강의중" 30~60초 강의실 미리보기 — 전체화면, 보기 전용.
 * - 비로그인 포함 누구나 시청 가능.
 * - 화이트보드(판서) 실시간 + 화면공유 + 음성을 보여준다. 카메라(선생님·학생 얼굴)는 노출하지 않는다.
 * - 아무것도 조작할 수 없고(읽기 전용), 카운트다운이 끝나면 자동 종료 후 수강신청을 유도한다.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Whiteboard from '../classroom/Whiteboard.jsx'
import { usePreviewRoom } from './usePreviewRoom.js'

export default function LivePreviewModal({ session, onClose }) {
  const navigate = useNavigate()
  const closeButtonRef = useRef(null)
  const { status, error, screenTrack, audioTracks, secondsLeft, audioBlocked, resumeAudio } =
    usePreviewRoom(session ? session.sessionId : null)

  // 모달 열릴 때 닫기 버튼으로 초기 포커스
  useEffect(() => { closeButtonRef.current?.focus() }, [])

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 미리보기 동안 페이지 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (!session) return null

  const goEnroll = () => { onClose?.(); navigate(`/courses/${session.courseId}`) }
  const ended = status === 'expired' || status === 'disconnected'
  const errored = status === 'error'

  return (
    <div className="lp-overlay" role="dialog" aria-modal="true" aria-labelledby="lp-title">
      <div className="lp-fullscreen">
        {/* 상단 바 */}
        <div className="lp-topbar">
          <span className="lp-live-badge">● LIVE</span>
          <div className="lp-head-text">
            <div id="lp-title" className="lp-course-title">{session.courseTitle}</div>
            <div className="lp-teacher">{session.teacherName} 선생님 · {session.subjectName}</div>
          </div>
          {status === 'connected' && secondsLeft != null && (
            <span className={`lp-countdown${secondsLeft <= 10 ? ' lp-countdown--urgent' : ''}`}>
              미리보기 {secondsLeft}초
            </span>
          )}
          <button ref={closeButtonRef} className="lp-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* 본문 */}
        {errored ? (
          <div className="lp-stage lp-stage--message">
            <div className="lp-message">
              <p>
                {error?.status === 404
                  ? '이미 종료된 강의실이에요.'
                  : error?.status === 429
                    ? '이 수업 미리보기를 2회 모두 사용했어요.'
                    : '미리보기를 불러오지 못했어요.'}
              </p>
              <button className="btn btn-secondary" onClick={onClose}>닫기</button>
            </div>
          </div>
        ) : ended ? (
          <div className="lp-stage lp-stage--message">
            <div className="lp-message lp-upsell-card">
              <p className="lp-upsell-title">미리보기가 끝났어요</p>
              <p>수강신청하면 처음부터 끝까지 함께할 수 있어요.</p>
              <button className="btn btn-primary" onClick={goEnroll}>수강신청하러 가기</button>
            </div>
          </div>
        ) : (
          <div className="lp-stage">
            {/* 화면공유(있으면) — 화이트보드 뒤에 깔린다 */}
            {screenTrack && <ScreenVideo track={screenTrack} />}
            {/* 화이트보드(읽기 전용, 실시간). 화면공유 중이면 배경 투명 */}
            <div className="lp-board">
              <Whiteboard sessionId={session.sessionId} readOnly canDraw={false} transparent={!!screenTrack} />
            </div>
            {/* 음성(숨김) */}
            {audioTracks.map((t) => <PreviewAudio key={t.sid || t.mediaStreamID} track={t} />)}

            {status === 'connecting' && (
              <div className="lp-connecting">강의실에 연결하는 중…</div>
            )}
            {audioBlocked && (
              <button className="lp-audio-resume" onClick={resumeAudio}>🔇 소리 켜기</button>
            )}
          </div>
        )}

        {/* 하단 수강신청 유도 */}
        {!ended && !errored && (
          <div className="lp-upsell-bar">
            <span>수강신청하면 카메라·채팅까지 전체 수업에 참여할 수 있어요</span>
            <button className="btn btn-coral btn-sm" onClick={goEnroll}>수강신청 →</button>
          </div>
        )}
      </div>
    </div>
  )
}

/** 화면공유 영상 트랙을 <video>에 attach. */
function ScreenVideo({ track }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !track) return undefined
    track.attach(el)
    return () => { track.detach(el) }
  }, [track])
  return <video ref={ref} autoPlay playsInline muted className="lp-screen-video" />
}

/** 음성 트랙을 숨김 <audio>에 attach. */
function PreviewAudio({ track }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !track) return undefined
    track.attach(el)
    return () => { track.detach(el) }
  }, [track])
  return <audio ref={ref} autoPlay style={{ display: 'none' }} />
}
