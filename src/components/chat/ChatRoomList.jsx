/**
 * @file ChatRoomList.jsx
 * @description 채팅 위젯의 첫 화면 — 채팅방(1:1 대화) 목록입니다.
 * - 방을 누르면 onOpenRoom(roomId)로 대화 화면 전환을 요청합니다.
 * - 실연동 시 rooms는 GET /api/v1/chat-rooms 응답으로 채웁니다.
 */
import Avatar from '../ui/Avatar.jsx'
import { IconClose } from './icons.jsx'

/**
 * @param {object[]} rooms      방 목록
 * @param {boolean}  loading    방 목록 로딩 중 여부
 * @param {boolean}  failed     방 목록 로딩 실패 여부
 * @param {function} onClose    패널 닫기
 * @param {function} onOpenRoom 방 열기(roomId)
 */
export default function ChatRoomList({ rooms, loading = false, failed = false, onClose, onOpenRoom }) {
  const isEmpty = !loading && !failed && rooms.length === 0

  return (
    <>
      <header className="cw-head">
        <div className="cw-head-title">
          <span className="cw-head-emoji">💬</span> 메시지
        </div>
        <button className="cw-icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
      </header>

      <ul className="cw-rooms">
        {loading && rooms.length === 0 && (
          <li className="cw-room-empty">채팅방을 불러오는 중...</li>
        )}
        {failed && rooms.length === 0 && (
          <li className="cw-room-empty">채팅방을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</li>
        )}
        {isEmpty && (
          <li className="cw-room-empty">아직 대화가 없어요. 선생님·학생과 1:1 채팅을 시작해보세요.</li>
        )}
        {rooms.map((r, index) => (
          <li key={r.id} style={{ '--cw-delay': `${index * 55}ms` }}>
            <button className="cw-room" onClick={() => onOpenRoom(r.id)}>
              <div className="cw-room-avatar">
                <Avatar size="sm" color={r.avatar}>{r.initial}</Avatar>
                {r.online && <span className="cw-online-dot" aria-hidden="true" />}
              </div>
              <div className="cw-room-main">
                <div className="cw-room-row">
                  <span className="cw-room-name">{r.name}</span>
                  <span className="cw-room-time">{r.time}</span>
                </div>
                <div className="cw-room-row">
                  <span className="cw-room-last">{r.last}</span>
                  {r.unread > 0 && <span className="cw-unread">{r.unread}</span>}
                </div>
                <div className="cw-room-subject">{r.subject}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="cw-foot">
        <span className="cw-foot-dot" /> 실시간 채팅
      </div>
    </>
  )
}
