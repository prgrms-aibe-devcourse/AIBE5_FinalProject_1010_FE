/**
 * @file ChatMessage.jsx
 * @description 채팅 대화의 메시지 한 줄을 그리는 UI 컴포넌트입니다.
 * - 일반 메시지: 말풍선 + 시각. role==='me'이면 오른쪽 정렬/teal 말풍선.
 * - 시스템 메시지: message.sys가 있으면 가운데 안내 칩으로 렌더링.
 */

/**
 * @param {object} message { role:'me'|'other', text, attachments, time } 또는 { sys }
 */
export default function ChatMessage({ message }) {
  if (message.sys) {
    return <div className="cw-sys">{message.sys}</div>
  }

  const mine = message.role === 'me'
  const attachments = message.attachments || []

  return (
    <div className={`cw-msg ${mine ? 'me' : ''}`}>
      {attachments.length > 0 && (
        <div className={`cw-attachments count-${Math.min(attachments.length, 4)}`}>
          {attachments.map((image) => (
            <a
              className="cw-attachment"
              href={image.url}
              key={image.key || image.url}
              target="_blank"
              rel="noreferrer"
            >
              <img src={image.url} alt={image.name || '첨부 이미지'} />
            </a>
          ))}
        </div>
      )}
      {message.text && <div className="cw-bubble">{message.text}</div>}
      <div className="cw-msg-time">{message.time}</div>
    </div>
  )
}
