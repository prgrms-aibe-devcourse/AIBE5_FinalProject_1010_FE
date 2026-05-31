/**
 * @file Composer.jsx
 * @description 채팅 하단의 질문 입력창입니다.
 * - 텍스트 입력 + 전송 버튼 + (비활성) 이미지 첨부 버튼으로 구성됩니다.
 * - Enter 전송 / Shift+Enter 줄바꿈을 지원합니다.
 * - AI가 답변 생성 중(thinking)일 때는 입력/전송을 잠급니다.
 *
 * 이미지 첨부 버튼은 지금은 placeholder입니다.
 * 실연동 시 파일 업로드(S3) → questionImageUrl을 POST /api/v1/ai/questions에 함께 전송합니다.
 */
import { useRef, useEffect } from 'react'

/**
 * 질문 입력 컴포저.
 * @param {string}   value    입력값
 * @param {function} onChange 입력 변경 핸들러
 * @param {function} onSend   전송 핸들러
 * @param {boolean}  thinking AI 응답 생성 중 여부(잠금)
 * @param {string}   subjectName 입력창 placeholder에 쓸 과목명
 */
export default function Composer({ value, onChange, onSend, thinking, subjectName }) {
  // textarea 높이를 내용에 맞춰 자동으로 늘려주기 위한 ref입니다.
  const taRef = useRef(null)

  // 입력값이 바뀔 때마다 높이를 재계산합니다(최대 높이는 CSS에서 제한).
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [value])

  // Enter=전송, Shift+Enter=줄바꿈. (조합 입력 중이면 무시해 한글 마지막 글자 중복 전송 방지)
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSend()
    }
  }

  // 입력값이 공백뿐이거나 AI가 생각 중이면 전송 비활성화합니다.
  const canSend = value.trim().length > 0 && !thinking

  return (
    <div className="ai-composer-wrap">
      <div className={`ai-composer ${thinking ? 'locked' : ''}`}>
        {/* 이미지 첨부 (placeholder) — 아직 동작하지 않음 */}
        <button
          className="ai-attach"
          type="button"
          disabled
          title="이미지 첨부는 준비 중이에요"
          aria-label="이미지 첨부 (준비 중)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15l-5-5L5 21" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        </button>

        {/* 질문 입력 textarea (자동 높이) */}
        <textarea
          ref={taRef}
          rows={1}
          className="ai-input"
          placeholder={thinking ? 'AI가 답변을 작성 중이에요…' : `${subjectName} 관련 질문을 입력하세요`}
          value={value}
          disabled={thinking}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* 전송 버튼 — 보낼 수 있을 때만 활성화되고 살짝 튀어오르는 효과가 있습니다. */}
        <button
          className="ai-send"
          type="button"
          disabled={!canSend}
          onClick={onSend}
          aria-label="질문 전송"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* 입력창 아래 안내 문구 */}
      <p className="ai-composer-hint">
        Enter 전송 · Shift+Enter 줄바꿈 · AI 답변은 참고용이며 정확하지 않을 수 있어요
      </p>
    </div>
  )
}
