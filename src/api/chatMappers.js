/**
 * @file chatMappers.js
 * @description 백엔드 채팅 응답(ChatRoomResponse / ChatMessageResponse)을
 * 위젯 컴포넌트가 쓰는 UI 형태로 변환합니다.
 */
import { toAbsoluteFileUrl } from './fileApi.js'

const AVATAR_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

/** id를 c1~c6 아바타 색 토큰으로 안정적으로 매핑. */
export function avatarColor(id) {
  const n = Math.abs(Number(id) || 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

/** 이름의 첫 글자(아바타 표시용). */
export function initialOf(name) {
  return (name || '?').trim().charAt(0) || '?'
}

/** ISO 시각 → "오후 2:03" / "어제" / "6월 1일" 표시 문자열. */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) {
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    const ampm = h < 12 ? '오전' : '오후'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${ampm} ${h12}:${m}`
  }
  if (d.toDateString() === yesterday.toDateString()) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

const PARTICIPANT_LABEL = { TEACHER: '선생님', STUDENT: '학생' }

/**
 * ChatRoomResponse → 방 목록 항목.
 * 1:1 방에서는 "나가 아닌 상대"를 대표로 표시합니다.
 */
export function mapRoom(room, myId) {
  const participants = room.participants || []
  const other = participants.find((p) => p.userId !== myId) || participants[0] || null
  const name = other?.name || (room.roomType === 'COURSE_GROUP' ? '그룹 채팅' : '대화 상대')

  const lastMessage = room.lastMessage
  const lastText = lastMessage
    ? lastMessage.messageType === 'IMAGE'
      ? '📷 사진'
      : lastMessage.content || ''
    : '대화를 시작해보세요'

  return {
    id: room.roomId,
    name,
    initial: initialOf(name),
    avatar: avatarColor(other?.userId ?? room.roomId),
    subject:
      PARTICIPANT_LABEL[other?.participantType] ||
      (room.roomType === 'COURSE_GROUP' ? '그룹' : '1:1 채팅'),
    last: lastText,
    time: formatTime(room.lastMessageAt || lastMessage?.sentAt),
    unread: room.unreadCount || 0,
    online: false, // 서버에 실시간 접속 상태 정보가 없으므로 표시하지 않음
    raw: room,
  }
}

/**
 * ChatMessageResponse → 말풍선 메시지.
 * 내가 보낸 메시지(senderId === myId)는 role 'me'로 오른쪽 정렬됩니다.
 */
export function mapMessage(msg, myId) {
  return {
    key: msg.messageId,
    messageId: msg.messageId,
    role: msg.senderId === myId ? 'me' : 'other',
    text: msg.content || '',
    attachments: (msg.attachments || []).map((a) => ({
      key: a.fileId,
      url: toAbsoluteFileUrl(a.fileUrl),
      thumbnailUrl: toAbsoluteFileUrl(a.thumbnailUrl),
      name: a.originalFileName,
    })),
    time: formatTime(msg.sentAt || msg.createdAt),
  }
}
