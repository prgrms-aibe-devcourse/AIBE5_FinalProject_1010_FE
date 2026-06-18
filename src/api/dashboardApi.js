/**
 * @file dashboardApi.js
 * @description 수업별 페이지(대시보드) 관련 API 모듈
 * - 대시보드 정보, 공지사항, 자유게시판, 수강생 목록
 */

import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

const base = (courseId) => `${API_BASE}/api/v1/courses/${courseId}`

// ── 파일 업로드 ───────────────────────────────────

// 파일 업로드 공통 헬퍼
async function uploadAttachment(endpoint, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await authFetch(`${API_BASE}${endpoint}`, { method: 'POST', body: form })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || `업로드 실패 (${res.status})`)
  }
  return res.json()
}

// 공지사항 첨부파일 업로드 (이미지 / PDF, 최대 20MB)
export function uploadNoticeAttachment(file) {
  return uploadAttachment('/api/v1/files/notice/attachments', file)
}

// 게시판 첨부파일 업로드 (이미지 / PDF, 최대 20MB)
export function uploadPostAttachment(file) {
  return uploadAttachment('/api/v1/files/post/attachments', file)
}

// ── 대시보드 ─────────────────────────────────────

export async function fetchDashboard(courseId) {
  const res = await authFetch(`${base(courseId)}/dashboard`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function fetchEnrollments(courseId) {
  const res = await authFetch(`${base(courseId)}/enrollments`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

// ── 공지사항 ─────────────────────────────────────

export async function fetchNotices(courseId, page = 0) {
  const res = await authFetch(`${base(courseId)}/notices?page=${page}&size=20`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function createNotice(courseId, data) {
  const res = await authFetch(`${base(courseId)}/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function updateNotice(courseId, noticeId, data) {
  const res = await authFetch(`${base(courseId)}/notices/${noticeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function deleteNotice(courseId, noticeId) {
  const res = await authFetch(`${base(courseId)}/notices/${noticeId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(res.status)
}

// ── 자유게시판 ───────────────────────────────────

export async function fetchPosts(courseId, page = 0) {
  const res = await authFetch(`${base(courseId)}/posts?page=${page}&size=20`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function fetchPost(courseId, postId) {
  const res = await authFetch(`${base(courseId)}/posts/${postId}`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function createPost(courseId, data) {
  const res = await authFetch(`${base(courseId)}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function updatePost(courseId, postId, data) {
  const res = await authFetch(`${base(courseId)}/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function deletePost(courseId, postId) {
  const res = await authFetch(`${base(courseId)}/posts/${postId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(res.status)
}

export async function createComment(courseId, postId, content) {
  const res = await authFetch(`${base(courseId)}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function deleteComment(courseId, postId, commentId) {
  const res = await authFetch(`${base(courseId)}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(res.status)
}

// ── 다음 수업 일시 ──────────────────────────────

export async function updateNextClass(courseId, nextClassAt) {
  const res = await authFetch(`${base(courseId)}/next-class`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nextClassAt }),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

// ── 출석 현황 ────────────────────────────────────

export async function fetchAttendance(courseId) {
  const res = await authFetch(`${base(courseId)}/attendance`)
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

// ── 과제 ────────────────────────────────────────

const assignmentBase = (courseId) => `${base(courseId)}/assignments`

export async function fetchAssignments(courseId) {
  const res = await authFetch(assignmentBase(courseId))
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function createAssignment(courseId, data) {
  const res = await authFetch(assignmentBase(courseId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function updateAssignment(courseId, assignmentId, data) {
  const res = await authFetch(`${assignmentBase(courseId)}/${assignmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

export async function deleteAssignment(courseId, assignmentId) {
  const res = await authFetch(`${assignmentBase(courseId)}/${assignmentId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(res.status)
}


