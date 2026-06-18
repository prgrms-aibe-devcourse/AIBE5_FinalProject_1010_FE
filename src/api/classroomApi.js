/**
 * @file classroomApi.js
 * @description 강의실(실시간 화상수업) REST API 호출 모음입니다. (백엔드 ClassroomSessionController / ClassroomParticipantController, apidetail.md 22장)
 * - 열기/종료/권한변경은 담당 선생님 전용, 조회/참가/토큰은 수업 멤버(담당교사·ACTIVE 수강생) 전용이며
 *   멤버십·소유권 검증은 백엔드가 수행하고 위반 시 403을 반환합니다.
 * - 현재 세션 조회(getCurrentSession)는 열린 강의실이 없으면 404를 던지므로, 호출부에서 404를 "세션 없음"으로 구분 처리합니다.
 */
import { authFetch } from './authFetch.js'
import { API_BASE_URL } from '../auth/authApi.js'

const BASE = `${API_BASE_URL}/api/v1`

async function toJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

/**
 * 22-1 강의실 열기 (담당 선생님). POST /api/v1/courses/{courseId}/classroom-sessions
 * - 이미 열린 강의실이 있으면 그 세션을 그대로 반환(멱등).
 * @param {number} courseId
 * @returns {Promise<{sessionId:number, courseId:number, status:'OPEN'|'CLOSED', startedAt:string, createdAt:string}>}
 */
export async function openClassroom(courseId) {
  return toJson(
    await authFetch(`${BASE}/courses/${courseId}/classroom-sessions`, { method: 'POST' }),
  )
}

/**
 * 22-2 현재 강의실 조회 (수업 멤버). GET /api/v1/courses/{courseId}/classroom-sessions/current
 * - 열린 강의실이 없으면 백엔드가 404를 반환하므로, 이 함수는 그 경우 null을 반환한다(그 외 오류는 throw).
 * @param {number} courseId
 * @returns {Promise<{sessionId:number, courseId:number, status:string, startedAt:string, endedAt:string|null, durationSeconds:number|null}|null>}
 */
export async function getCurrentSession(courseId) {
  const res = await authFetch(`${BASE}/courses/${courseId}/classroom-sessions/current`)
  if (res.status === 404) return null
  return toJson(res)
}

/**
 * 22-3 강의실 참가 (수업 멤버). POST /api/v1/classroom-sessions/{sessionId}/participants
 * - 재입장 시 기존 참가 정보를 반환한다.
 * @param {number} sessionId
 * @returns {Promise<{participantId:number, sessionId:number, userId:number, canDraw:boolean, canShareScreen:boolean, canChat:boolean, isVideoOn:boolean, isAudioOn:boolean, joinedAt:string}>}
 */
// 같은 세션 입장 요청이 동시에 여러 번 나가는 것 방지(React StrictMode 이중 호출/더블클릭).
// 진행 중인 동일 sessionId 요청이 있으면 그 Promise를 재사용 → 서버에 POST는 1번만.
const _joinInFlight = new Map()
export function joinSession(sessionId) {
  if (_joinInFlight.has(sessionId)) return _joinInFlight.get(sessionId)
  const p = (async () =>
    toJson(await authFetch(`${BASE}/classroom-sessions/${sessionId}/participants`, { method: 'POST' }))
  )().finally(() => _joinInFlight.delete(sessionId))
  _joinInFlight.set(sessionId, p)
  return p
}

/**
 * 세션 참가자 목록 조회 (수업 멤버). GET /api/v1/classroom-sessions/{sessionId}/participants
 * - 선생님 판서 권한 토글 UI(roster)에서 tile(userId) → participantId 매핑에 사용한다(이슈 #99).
 * @param {number} sessionId
 * @returns {Promise<Array<{participantId:number, sessionId:number, userId:number, canDraw:boolean, canShareScreen:boolean, canChat:boolean, isVideoOn:boolean, isAudioOn:boolean, joinedAt:string}>>}
 */
export async function fetchSessionParticipants(sessionId) {
  return toJson(await authFetch(`${BASE}/classroom-sessions/${sessionId}/participants`))
}

/**
 * 22-4 LiveKit 토큰 발급 (수업 멤버). POST /api/v1/classroom-sessions/{sessionId}/livekit-token
 * - 입장 시점마다 즉석 발급(저장 안 함). 송출 권한(canPublish)이 토큰에 반영된다.
 * @param {number} sessionId
 * @param {string} [deviceType='WEB'] 클라이언트 구분용(현재 토큰 발급에는 영향 없음)
 * @returns {Promise<{livekitUrl:string, roomName:string, token:string, identity:string, displayName:string, role:string}>}
 */
export async function issueLivekitToken(sessionId, deviceType = 'WEB') {
  return toJson(
    await authFetch(`${BASE}/classroom-sessions/${sessionId}/livekit-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceType }),
    }),
  )
}

/**
 * 22-6 강의실 종료 (담당 선생님). PATCH /api/v1/classroom-sessions/{sessionId}/close
 * @param {number} sessionId
 * @returns {Promise<{sessionId:number, status:'CLOSED', endedAt:string, durationSeconds:number}>}
 */
export async function closeSession(sessionId) {
  return toJson(
    await authFetch(`${BASE}/classroom-sessions/${sessionId}/close`, { method: 'PATCH' }),
  )
}

/**
 * 강의실 하트비트 (호스트). POST /api/v1/classroom-sessions/{sessionId}/heartbeat
 * - 선생님 FE가 강의실에 있는 동안 주기적으로 호출 → 부재 자동종료 타이머 리셋.
 * - 응답 status가 'CLOSED'면 이미 종료된 것이므로 호출부에서 강의실을 나간다.
 * @param {number} sessionId
 * @returns {Promise<{status:'OPEN'|'CLOSED'}>}
 */
export async function sendHeartbeat(sessionId) {
  return toJson(
    await authFetch(`${BASE}/classroom-sessions/${sessionId}/heartbeat`, { method: 'POST' }),
  )
}

/**
 * 23-1 강의실 채팅 이력 조회 (수업 멤버). GET /api/v1/classroom-sessions/{sessionId}/chats
 * - 입장 시 과거 메시지를 한 번 불러오는 용도. 실시간 송수신은 WebSocket(chatSocket.js)이 담당한다.
 * @param {number} sessionId
 * @returns {Promise<Array<{chatId:number, sessionId:number, senderId:number, senderName:string, content:string, createdAt:string}>>}
 */
export async function fetchClassroomChats(sessionId) {
  return toJson(await authFetch(`${BASE}/classroom-sessions/${sessionId}/chats`))
}

/**
 * 화이트보드 현재 스냅샷 조회 (#131). GET /api/v1/classroom-sessions/{sessionId}/whiteboard
 * - 입장 시 현재까지 그려진 보드를 1회 받아 동기화. 없으면 { board: null }.
 * @returns {Promise<{board: object|null}>}
 */
export async function fetchWhiteboardSnapshot(sessionId) {
  return toJson(await authFetch(`${BASE}/classroom-sessions/${sessionId}/whiteboard`))
}

/**
 * 22-5 참가자 권한 변경 (담당 선생님). PATCH /api/v1/classroom-participants/{participantId}/permissions
 * - 송출 게이팅: canPublish는 선택값(null/undefined면 기존 값 유지). 발표시킬 학생에게만 true.
 * @param {number} participantId
 * @param {{canDraw:boolean, canShareScreen:boolean, canChat:boolean, canPublish?:boolean}} permissions
 * @returns {Promise<{participantId:number, canDraw:boolean, canShareScreen:boolean, canChat:boolean, canPublish:boolean}>}
 */
export async function updateParticipantPermissions(participantId, { canDraw, canShareScreen, canChat, canPublish } = {}) {
  const body = { canDraw, canShareScreen, canChat }
  if (canPublish != null) body.canPublish = canPublish
  return toJson(
    await authFetch(`${BASE}/classroom-participants/${participantId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}
