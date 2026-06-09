/**
 * @file qnaApi.js
 * @description QnA 질문게시판 REST API 호출 모음입니다. (백엔드 QnaQuestionController / QnaAnswerController)
 * - 목록/상세 GET은 Public이지만, 로그인 상태면 좋아요 여부(liked) 계산을 위해 토큰을 함께 보내야 하므로
 *   authFetch(Authorization 자동 첨부 + 401 시 재발급/재시도)를 사용합니다.
 * - 질문 작성=STUDENT, 답변 작성=TEACHER 권한이며 위반 시 백엔드가 403을 반환합니다.
 */
import { authFetch } from './authFetch.js'
import { API_BASE_URL } from '../auth/authApi.js'
import { toAbsoluteFileUrl } from './fileApi.js'
import { formatRelativeTime } from '../utils/datetime.js'

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
 * 백엔드 질문 목록 항목(QnaQuestionSummaryResponse)을 카드 컴포넌트가 기대하는 post 형태로 변환한다.
 * (목록 응답에는 본문 content가 없으므로 body는 비운다 — 본문은 상세 조회에서 제공)
 */
export function mapSummaryToPost(q) {
  const subjectName = q.subject?.name ?? '기타'
  const authorName = q.authorName ?? '익명'
  return {
    id: q.questionId,
    title: q.title,
    // 본문 미리보기(서버에서 자른 평문). 카드의 line-clamp로 넘치면 …으로 잘린다.
    body: q.contentPreview ?? '',
    subject: subjectName,
    subjectId: q.subject?.subjectId ?? null,
    tags: [{ label: subjectName, cls: 'peach' }],
    author: { name: authorName, avatar: 'c1', initial: authorName.charAt(0) || '?' },
    time: formatRelativeTime(q.createdAt),
    answers: q.answerCount ?? 0,
    answersLabel: `답변 ${q.answerCount ?? 0}`,
    answersCls: q.isResolved ? 'resolved' : '',
    imageType: null,
    // 첫 번째 첨부 이미지(목록 카드 썸네일). 없으면 null.
    imageUrl: q.thumbnailUrl ? toAbsoluteFileUrl(q.thumbnailUrl) : null,
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
export async function createQuestion({ subjectId, title, content, imageFileIds, blocks }) {
  const body = { subjectId, title, content }
  if (blocks) body.blocks = blocks // 블록을 주면 이미지 첨부는 백엔드가 블록에서 도출한다
  else body.imageFileIds = imageFileIds ?? []
  return toJson(
    await authFetch(`${BASE}/qna/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

/**
 * 질문 상세 조회 (Public). GET /api/v1/qna/questions/{questionId}
 * → { questionId, subject:{subjectId,name}, title, content, images:[{fileId,url}], isResolved, viewCount,
 *     author:{userId,name}, answers:[{answerId, authorId, authorName, content, isAccepted,
 *     likeCount, liked, images:[{fileId,url}], blocks, createdAt}], createdAt }
 *   (질문·답변 이미지 모두 수정 시 일부만 남길 수 있도록 fileId를 포함한 객체 배열(images)로 내려온다.)
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
export async function createAnswer(questionId, { content, imageFileIds, blocks }) {
  const body = { content }
  if (blocks) body.blocks = blocks
  else body.imageFileIds = imageFileIds ?? []
  return toJson(
    await authFetch(`${BASE}/qna/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

/**
 * 질문 수정 (작성 학생 본인). PATCH /api/v1/qna/questions/{questionId}
 * @param {{subjectId:number, title:string, content:string, imageFileIds?:number[]}} body
 *   imageFileIds를 생략하면(undefined) 백엔드에서 기존 이미지를 유지하고, 배열을 주면 그 목록으로 교체한다.
 */
export async function updateQuestion(questionId, { subjectId, title, content, imageFileIds, blocks }) {
  const body = { subjectId, title, content }
  if (blocks) body.blocks = blocks // 블록을 주면 이미지는 블록 기준으로 전체 교체된다
  else if (imageFileIds !== undefined) body.imageFileIds = imageFileIds
  const res = await authFetch(`${BASE}/qna/questions/${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `질문 수정 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
}

/**
 * 답변 수정 (작성 선생님 본인). PATCH /api/v1/qna/answers/{answerId}
 * @param {{content:string, imageFileIds?:number[]}} body  imageFileIds 생략 시 이미지 유지.
 */
export async function updateAnswer(answerId, { content, imageFileIds, blocks }) {
  const body = { content }
  if (blocks) body.blocks = blocks
  else if (imageFileIds !== undefined) body.imageFileIds = imageFileIds
  const res = await authFetch(`${BASE}/qna/answers/${answerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `답변 수정 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
}

/** 질문 삭제 (작성 학생 본인 또는 관리자). DELETE /api/v1/qna/questions/{questionId} */
export async function deleteQuestion(questionId) {
  const res = await authFetch(`${BASE}/qna/questions/${questionId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `질문 삭제 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
}

/** 답변 삭제 (작성 선생님 본인 또는 관리자). DELETE /api/v1/qna/answers/{answerId} */
export async function deleteAnswer(answerId) {
  const res = await authFetch(`${BASE}/qna/answers/${answerId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `답변 삭제 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
}
