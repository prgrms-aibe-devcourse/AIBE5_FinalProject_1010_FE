/**
 * @file chatRooms.js
 * @description 전역 채팅 위젯(ChatWidget)에서 쓰는 더미 데이터입니다.
 * - 백엔드 연동 전까지 채팅방 목록/대화를 흉내 내기 위한 목업입니다.
 * - 실연동 시 교체 지점(StudyFlow 백엔드 ChatRoomController 기준):
 *     · 방 목록 : GET  /api/v1/chat-rooms
 *     · 메시지  : GET  /api/v1/chat-rooms/{roomId}/messages
 *     · 전송    : WebSocket(STOMP) pub /pub/chat/message  (또는 방 생성 POST /chat-rooms/direct)
 *   해당 위치에 TODO(API) 주석을 달아두었습니다.
 */

/**
 * 좌측 방 목록에 표시할 더미 채팅방.
 * - id      : 명세상 roomId 자리(현재는 임시값)
 * - name    : 상대 표시명
 * - avatar  : Avatar 색상 토큰(c1~c6)
 * - initial : 아바타에 표시할 첫 글자
 * - subject : 어떤 수업/맥락의 대화인지 부제
 * - last    : 마지막 메시지 미리보기
 * - time    : 마지막 메시지 시각(표시용 문자열)
 * - unread  : 안 읽은 메시지 수(배지)
 * - online  : 접속 표시 점
 */
export const chatRooms = [
  { id: 1, name: '박지훈 선생님', avatar: 'c1', initial: '박', subject: '미적분 II', last: '맞아요 재섭이! 정확합니다 👏', time: '오후 2:03', unread: 0, online: true },
  { id: 2, name: '김민지', avatar: 'c3', initial: '민', subject: '영어 회화', last: '다음 수업 자료 미리 봐도 될까요?', time: '오전 11:20', unread: 2, online: true },
  { id: 3, name: '이수학 선생님', avatar: 'c4', initial: '이', subject: '고1 수학', last: '숙제 잘 봤어요. 다음엔 3단원!', time: '어제', unread: 0, online: false },
  { id: 4, name: 'StudyFlow 운영팀', avatar: 'c6', initial: 'S', subject: '고객지원', last: '문의 주셔서 감사합니다 :)', time: '2일 전', unread: 0, online: false },
]

/**
 * 방(roomId)별 더미 메시지.
 * - role: 'me'(나) | 'other'(상대). sys가 있으면 가운데 시스템 안내로 렌더링됩니다.
 * - 실연동 시 GET /api/v1/chat-rooms/{roomId}/messages 응답으로 교체합니다.
 */
export const initialMessages = {
  1: [
    { sys: '— 박지훈 선생님과의 1:1 채팅 —' },
    { role: 'other', text: '재섭 학생, 오늘 질문 있었죠?', time: '오후 2:00' },
    { role: 'me', text: "네! f'(x) 먼저 구하는 거 맞나요?", time: '오후 2:03' },
    { role: 'other', text: '맞아요 재섭이! 정확합니다 👏', time: '오후 2:03' },
  ],
  2: [
    { role: 'other', text: '선생님 안녕하세요!', time: '오전 11:18' },
    { role: 'other', text: '다음 수업 자료 미리 봐도 될까요?', time: '오전 11:20' },
  ],
  3: [
    { sys: '— 이수학 선생님과의 1:1 채팅 —' },
    { role: 'other', text: '숙제 잘 봤어요. 다음엔 3단원 나갈게요!', time: '어제' },
  ],
  4: [
    { role: 'other', text: '안녕하세요! StudyFlow 운영팀입니다. 무엇을 도와드릴까요?', time: '2일 전' },
    { role: 'me', text: '결제 내역은 어디서 확인하나요?', time: '2일 전' },
    { role: 'other', text: '문의 주셔서 감사합니다 :) 마이페이지 > 결제 내역에서 확인 가능합니다.', time: '2일 전' },
  ],
}

/** 데모용 자동 응답 문구(상대가 보낸 척). 실연동 시 제거합니다. */
export function mockReply(name) {
  return `（${name}）메시지 잘 받았어요! 데모 모드라 자동 응답 중이에요 🙂`
}
