/**
 * @file ChatConversation.jsx
 * @description 채팅 위젯의 대화 화면 — 특정 방의 메시지 목록 + 입력창입니다.
 * - 헤더: 뒤로가기 / 상대 정보 / 닫기
 * - 본문: 메시지 목록(ChatMessage) + 자동 스크롤 앵커
 * - 하단: 입력창(ChatComposer)
 */
import Avatar from '../ui/Avatar.jsx'
import ChatMessage from './ChatMessage.jsx'
import ChatComposer from './ChatComposer.jsx'
import VoiceCallPanel from './VoiceCallPanel.jsx'
import { IconBack, IconClose, IconPhone } from './icons.jsx'

/**
 * @param {object}   room      현재 방 정보
 * @param {object[]} messages  현재 방 메시지 목록
 * @param {string}   input     입력값
 * @param {function} onInput   입력 변경
 * @param {function} onSend    전송
 * @param {function} onBack    목록으로
 * @param {function} onClose   패널 닫기
 * @param {object}   bottomRef 자동 스크롤용 ref(부모가 보유)
 * @param {boolean}  isTyping  상대 입력 중 표시 여부
 * @param {object}   voiceCall 보이스톡 상태/핸들러
 */
export default function ChatConversation({ room, messages, input, onInput, onSend, onBack, onClose, bottomRef, isTyping = false, voiceCall = null }) {
  return (
    <>
      <header className="cw-head">
        <button className="cw-icon-btn" onClick={onBack} aria-label="목록으로"><IconBack /></button>
        <div className="cw-convo-title">
          <Avatar size="sm" color={room?.avatar || 'c1'}>{room?.initial || '?'}</Avatar>
          <div>
            <div className="cw-convo-name">{room?.name}</div>
            <div className="cw-convo-sub">{room?.online ? '접속 중' : room?.subject}</div>
          </div>
        </div>
        <button
          className={`cw-call-head-btn ${voiceCall?.status !== 'idle' ? 'is-active' : ''}`}
          type="button"
          onClick={voiceCall?.startCall}
          disabled={!voiceCall?.canStart}
          aria-label="보이스톡 시작"
        >
          <IconPhone />
          <span>보이스톡</span>
        </button>
        <button className="cw-icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
      </header>

      <VoiceCallPanel call={voiceCall} />

      <div className="cw-msgs">
        {messages.map((m, i) => (
          <ChatMessage key={m.key ?? i} message={m} />
        ))}
        {isTyping && (
          <div className="cw-typing" aria-label={`${room?.name || '상대'} 입력 중`}>
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer value={input} onChange={onInput} onSend={onSend} />
    </>
  )
}
