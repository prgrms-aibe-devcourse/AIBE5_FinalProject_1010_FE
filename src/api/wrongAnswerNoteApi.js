import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

const BASE = `${API_BASE}/api/v1/wrong-answer-notes`

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

export async function fetchWrongAnswerNotes({ subjectId, keyword, page = 0, size = 8 } = {}) {
  const params = new URLSearchParams()
  if (subjectId) params.set('subjectId', String(subjectId))
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  params.set('page', String(page))
  params.set('size', String(size))

  return toJson(await authFetch(`${BASE}?${params.toString()}`))
}

export async function fetchWrongAnswerNote(noteId) {
  return toJson(await authFetch(`${BASE}/${noteId}`))
}

export async function fetchWrongAnswerPracticeRecommendations({ subjectId, size = 10 } = {}) {
  const params = new URLSearchParams()
  if (subjectId) params.set('subjectId', String(subjectId))
  params.set('size', String(size))

  return toJson(await authFetch(`${BASE}/practice/recommendations?${params.toString()}`))
}

export async function viewWrongAnswerNoteAnswer(noteId) {
  return toJson(await authFetch(`${BASE}/${noteId}/answer-view`, { method: 'POST' }))
}

export async function recordWrongAnswerNoteReview(noteId, payload) {
  return toJson(
    await authFetch(`${BASE}/${noteId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchWrongAnswerNoteReviews(noteId, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))

  return toJson(await authFetch(`${BASE}/${noteId}/reviews?${params.toString()}`))
}

export async function createWrongAnswerNote(payload) {
  return toJson(
    await authFetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceType: 'DIRECT', ...payload }),
    }),
  )
}

export async function updateWrongAnswerNote(noteId, payload) {
  return toJson(
    await authFetch(`${BASE}/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

export async function deleteWrongAnswerNote(noteId) {
  const res = await authFetch(`${BASE}/${noteId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const error = new Error(data?.message || `삭제 실패 (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }
}
