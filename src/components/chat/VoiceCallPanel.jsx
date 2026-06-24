/**
 * @file VoiceCallPanel.jsx
 * @description 채팅방 보이스톡 상태 표시와 조작 버튼 UI입니다.
 */
import { useEffect, useState } from 'react'
import { IconMic, IconMicOff, IconPhone, IconPhoneOff } from './icons.jsx'

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const min = String(Math.floor(total / 60)).padStart(2, '0')
  const sec = String(total % 60).padStart(2, '0')
  return `${min}:${sec}`
}

function statusText(status, peerName) {
  if (status === 'incoming') return `${peerName}님의 보이스톡`
  if (status === 'outgoing') return `${peerName}님에게 거는 중`
  if (status === 'connecting') return '보이스톡 연결 중'
  if (status === 'active') return '보이스톡 연결됨'
  return ''
}

export default function VoiceCallPanel({ call }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (call?.status !== 'active') return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [call?.status])

  if (!call || call.status === 'idle') {
    return call?.error ? <div className="cw-call-error">{call.error}</div> : null
  }

  const peerName = call.peerName || '상대'

  return (
    <div className={`cw-call-panel is-${call.status}`} role="status">
      <audio ref={call.remoteAudioRef} autoPlay playsInline />

      <div className="cw-call-orb" aria-hidden="true">
        <IconPhone />
      </div>

      <div className="cw-call-main">
        <div className="cw-call-title">{statusText(call.status, peerName)}</div>
        <div className="cw-call-sub">
          {call.status === 'active' && call.startedAt
            ? formatElapsed(now - call.startedAt)
            : call.error || '마이크 권한이 필요합니다'}
        </div>
      </div>

      <div className="cw-call-actions">
        {call.status === 'incoming' && (
          <>
            <button className="cw-call-action accept" type="button" onClick={call.acceptCall} aria-label="보이스톡 받기">
              <IconPhone />
            </button>
            <button className="cw-call-action end" type="button" onClick={call.rejectCall} aria-label="보이스톡 거절">
              <IconPhoneOff />
            </button>
          </>
        )}

        {(call.status === 'outgoing' || call.status === 'connecting') && (
          <button className="cw-call-action end" type="button" onClick={call.hangUp} aria-label="보이스톡 취소">
            <IconPhoneOff />
          </button>
        )}

        {call.status === 'active' && (
          <>
            <button
              className={`cw-call-action ${call.muted ? 'muted' : ''}`}
              type="button"
              onClick={call.toggleMute}
              aria-label={call.muted ? '마이크 켜기' : '마이크 끄기'}
            >
              {call.muted ? <IconMicOff /> : <IconMic />}
            </button>
            <button className="cw-call-action end" type="button" onClick={call.hangUp} aria-label="보이스톡 종료">
              <IconPhoneOff />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
