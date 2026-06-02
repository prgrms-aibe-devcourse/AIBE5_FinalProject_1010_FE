/**
 * @file aiApi.js
 * @description AI 질문 REST/스트리밍 API 호출 모음입니다. (백엔드 AiQuestionController)
 * - 인증이 필요하므로 authFetch(Authorization 자동 첨부 + 401 시 재발급/재시도)를 사용합니다.
 * - 스트리밍은 SSE(text/event-stream)인데, 브라우저 기본 EventSource는 GET만 + 헤더를 못 붙이므로,
 *   POST + Authorization이 필요한 우리 엔드포인트는 fetch + ReadableStream으로 직접 파싱합니다.
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
 * (동기) AI 질문 — 답변 전체를 한 번에 받는다.
 * POST /api/v1/ai/questions → AiQuestionResponse
 */
export async function askAiQuestion({ subjectId, questionText, questionImageFileIds = null, conversationId = null }) {
  return toJson(
    await authFetch(`${BASE}/ai/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, questionText, questionImageFileIds, conversationId }),
    }),
  )
}

/**
 * 내 대화 목록(과목별, 최신순). GET /api/v1/ai/conversations?subjectId=
 * → ConversationSummaryResponse[] : { conversationId, title, subjectId, createdAt, updatedAt }
 */
export async function fetchConversations(subjectId) {
  const qs = subjectId != null ? `?subjectId=${subjectId}` : ''
  return toJson(await authFetch(`${BASE}/ai/conversations${qs}`))
}

/**
 * 대화 상세(질문+답변 전체). GET /api/v1/ai/conversations/{id}
 * → { conversationId, title, subjectId, questions: AiQuestionResponse[] }  (questions는 오래된 순)
 */
export async function fetchConversation(conversationId) {
  return toJson(await authFetch(`${BASE}/ai/conversations/${conversationId}`))
}

/**
 * 내 AI 질문 기록(최신순, 페이징).
 * GET /api/v1/ai/questions?page=&size= → Page<AiQuestionHistoryResponse>
 * (응답: { content:[{ aiQuestionId, subject:{subjectId,name}, questionText, createdAt }], ... })
 */
export async function fetchAiHistory({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return toJson(await authFetch(`${BASE}/ai/questions?${params.toString()}`))
}

/**
 * AI 질문 기록 1건 상세 조회(질문 + 답변).
 * GET /api/v1/ai/questions/{id} → AiQuestionResponse
 * (목록 응답에는 answerText가 없으므로, 기록 클릭 시 과거 대화 복원에 사용)
 */
export async function fetchAiQuestion(aiQuestionId) {
  return toJson(await authFetch(`${BASE}/ai/questions/${aiQuestionId}`))
}

/**
 * (스트리밍) AI 질문 — 답변을 토큰 단위로 받아 실시간으로 흘려보낸다.
 * POST /api/v1/ai/questions/stream (text/event-stream)
 *
 * 서버 이벤트 규약:
 *  - (기본) data 이벤트: 답변 조각(토큰) 텍스트
 *  - event:done  → 저장된 기록(AiQuestionResponse JSON)
 *  - event:error → 오류 메시지
 *
 * @param {{subjectId:number, questionText:string, questionImageFileIds?:number[]|null}} body
 * @param {object} handlers
 * @param {(token:string)=>void} [handlers.onToken]  토큰 조각이 올 때마다 호출
 * @param {(saved:object)=>void} [handlers.onDone]   완료 시 저장된 기록으로 1회 호출
 * @param {(message:string)=>void} [handlers.onError] 서버 error 이벤트 시 호출
 * @param {AbortSignal} [handlers.signal] 취소용(컴포넌트 언마운트/새 질문 등)
 * @returns {Promise<void>} 스트림이 끝나면 resolve
 */
export async function streamAiQuestion(
  { subjectId, questionText, questionImageFileIds = null, conversationId = null },
  { onToken, onDone, onError, signal } = {},
) {
  const res = await authFetch(`${BASE}/ai/questions/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ subjectId, questionText, questionImageFileIds, conversationId }),
    signal,
  })

  // 스트림 시작 전 검증 실패(404/400/401 등)는 일반 JSON 에러로 온다.
  // throw하지 않고 onError로만 알린다(콜백 기반 API라 호출 측이 중복 처리하지 않도록).
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null)
    onError?.(data?.message || `요청 실패 (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let eventName = 'message'
  let dataLines = []
  let completed = false // 서버의 done 이벤트(정상 종료 신호)를 받았는지

  // 하나의 SSE 이벤트(빈 줄로 구분)를 처리한다.
  const dispatch = () => {
    if (dataLines.length === 0) {
      eventName = 'message'
      return
    }
    // data 라인들을 합친다(여러 줄 data 대비). 토큰의 앞/뒤 공백은 보존해야 하므로 trim 금지.
    const data = dataLines.join('\n')
    if (eventName === 'done') {
      let parsed = null
      try { parsed = JSON.parse(data) } catch { /* noop */ }
      completed = true // onDone 호출 전에 표시 → 이후 닫힘은 정상 종료로 간주
      onDone?.(parsed)
    } else if (eventName === 'error') {
      onError?.(data)
    } else {
      onToken?.(data)
    }
    eventName = 'message'
    dataLines = []
  }

  // 버퍼에서 완성된 줄들을 꺼내 SSE 라인 규칙에 따라 누적한다.
  const consumeLines = () => {
    let idx
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (line.endsWith('\r')) line = line.slice(0, -1) // CRLF 방어

      if (line === '') {
        dispatch() // 빈 줄 = 이벤트 경계
      } else if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        // "data:" 뒤를 그대로 사용한다. (스펙상 한 칸 공백을 떼지만, 우리 토큰의 앞 공백을
        //  보존하기 위해 Spring이 붙인 그대로 — 즉 prefix만 제거 — 를 취한다.)
        dataLines.push(line.slice(5))
      }
      // 그 외(주석 ':' 등)는 무시
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      consumeLines()
      // done 이벤트를 받았으면 정상 종료다. 더 읽지 않는다.
      // (서버가 곧 연결을 닫는데, 그 다음 read()가 '닫힘'을 오류로 던지는 것을 피한다.)
      if (completed) break
    }
    if (!completed) {
      // 스트림 종료 시 남은 데이터 처리.
      buffer += decoder.decode()
      // 서버가 마지막 이벤트(done 등) 뒤에 개행 없이 연결을 닫으면 그 줄이 버퍼에 갇혀
      // 처리되지 않는다(→ onDone 미호출). 끝에 개행을 보태 마지막 줄을 종결시켜 처리한다.
      if (buffer.length > 0 && !buffer.endsWith('\n')) buffer += '\n'
      consumeLines()
      if (dataLines.length > 0) dispatch()
    }
  } catch (e) {
    // 정상 종료(done 수신) 후의 닫힘 오류나, 사용자가 중단(AbortController)한 경우는 조용히 종료한다.
    if (completed || e?.name === 'AbortError') return
    onError?.('연결이 끊겼어요. 잠시 후 다시 시도해주세요.')
  } finally {
    // 리더/연결 정리. 이미 닫혔으면 무시.
    reader.cancel().catch(() => {})
  }
}
