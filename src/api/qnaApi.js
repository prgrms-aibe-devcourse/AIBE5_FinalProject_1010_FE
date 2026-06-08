/**
 * @file qnaApi.js
 * @description QnA 질문게시판 REST API 호출 모음입니다. (백엔드 QnaQuestionController / QnaAnswerController)
 * - 목록/상세 GET은 Public이지만, 로그인 상태면 좋아요 여부(liked) 계산을 위해 토큰을 함께 보내야 하므로
 *   authFetch(Authorization 자동 첨부 + 401 시 재발급/재시도)를 사용합니다.
 * - 질문 작성=STUDENT, 답변 작성=TEACHER 권한이며 위반 시 백엔드가 403을 반환합니다.
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

/** ISO 시각을 "방금 전 / n분 전 / n시간 전 / n일 전 / 날짜"로 표현한다. */
export function formatRelativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMin = Math.floor((Date.now() - then) / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

/**
 * 백엔드 질문 목록 항목(QnaQuestionSummaryResponse)을 카드 컴포넌트가 기대하는 post 형태로 변환한다.
 * (목록 응답에는 본문 content가 없으므로 body는 비운다 — 본문은 상세 조회에서 제공)
 */
export function mapSummaryToPost(q) {
  const subjectName = q.subject?.name ?? '기타'
  const authorName = q.authorName ?? '익명'
  return {
    id: q.questionId,
    title: q.title,
    body: '',
    subject: subjectName,
    subjectId: q.subject?.subjectId ?? null,
    tags: [{ label: subjectName, cls: 'peach' }],
    author: { name: authorName, avatar: 'c1', initial: authorName.charAt(0) || '?' },
    time: formatRelativeTime(q.createdAt),
    answers: q.answerCount ?? 0,
    answersLabel: `답변 ${q.answerCount ?? 0}`,
    answersCls: q.isResolved ? 'resolved' : '',
    imageType: null,
    views: q.viewCount ?? 0,
    status: q.isResolved ? 'resolved' : 'waiting',
    bookmarked: false,
  }
}

/**
 * 질문 목록 조회 (Public). GET /api/v1/qna/questions
 * @param {{subjectId?:number, keyword?:string, resolved?:boolean, page?:number, size?:number}} params
 * @returns {Promise<object>} Spring Page (content/totalElements/...)
 */
export async function fetchQuestions({ subjectId, keyword, resolved, page = 0, size = 100 } = {}) {
  const params = new URLSearchParams()
  if (subjectId != null) params.set('subjectId', String(subjectId))
  if (keyword) params.set('keyword', keyword)
  if (resolved != null) params.set('resolved', String(resolved))
  params.set('page', String(page))
  params.set('size', String(size))
  return toJson(await authFetch(`${BASE}/qna/questions?${params.toString()}`))
}

/**
 * 질문 작성 (STUDENT). POST /api/v1/qna/questions
 * @param {{subjectId:number, title:string, content:string, imageFileIds?:number[]}} body
 * → { questionId, isResolved, createdAt }
 */
export async function createQuestion({ subjectId, title, content, imageFileIds = [] }) {
  return toJson(
    await authFetch(`${BASE}/qna/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, title, content, imageFileIds }),
    }),
  )
}

/**
 * 질문 상세 조회 (Public). GET /api/v1/qna/questions/{questionId}
 * → { questionId, subject:{subjectId,name}, title, content, imageUrls:[], isResolved, viewCount,
 *     author:{userId,name}, answers:[{answerId, authorId, authorName, content, isAccepted,
 *     likeCount, liked, imageUrls:[], createdAt}], createdAt }
 */
export async function fetchQuestionDetail(questionId) {
  return toJson(await authFetch(`${BASE}/qna/questions/${questionId}`))
}

/**
 * 답변 작성 (TEACHER). POST /api/v1/qna/questions/{questionId}/answers
 * @param {number} questionId
 * @param {{content:string, imageFileIds?:number[]}} body
 * → { answerId, questionId, authorId, createdAt }
 */
export async function createAnswer(questionId, { content, imageFileIds = [] }) {
  return toJson(
    await authFetch(`${BASE}/qna/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, imageFileIds }),
    }),
  )
}

/**
 * 답변 채택 (질문 작성 STUDENT). PATCH /api/v1/qna/answers/{answerId}/accept
 * → { answerId, questionId, teacherUserId, isAccepted, questionResolved, addedNaegongScore, teacherNaegongScore }
 */
export async function acceptAnswer(answerId) {
  return toJson(await authFetch(`${BASE}/qna/answers/${answerId}/accept`, { method: 'PATCH' }))
}

/**
 * 답변 좋아요 토글 (로그인 사용자). POST /api/v1/qna/answers/{answerId}/likes
 * → { answerId, liked, likeCount }
 */
export async function toggleAnswerLike(answerId) {
  return toJson(await authFetch(`${BASE}/qna/answers/${answerId}/likes`, { method: 'POST' }))
}
