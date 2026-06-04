/**
 * @file fileApi.js
 * @description 이미지 업로드 및 파일 URL 유틸. (백엔드 FileController)
 * - 업로드는 multipart/form-data. authFetch가 Authorization은 붙이되 Content-Type은
 *   직접 지정하지 않아야 브라우저가 multipart 경계(boundary)를 자동으로 설정한다.
 */
import { authFetch } from './authFetch.js'
import { API_BASE_URL } from '../auth/authApi.js'

/**
 * 이미지 한 장을 업로드하고 메타데이터(fileId 포함)를 받는다.
 * POST /api/v1/files/chat/images  (key: file)
 * → { fileId, fileUrl, thumbnailUrl, originalFileName, contentType, fileSize, width, height }
 *
 * (AI 질문 첨부도 이 엔드포인트를 재사용한다. 받은 fileId를 questionImageFileIds로 전달.)
 * @param {File} file 업로드할 이미지 파일
 * @returns {Promise<object>} 업로드 응답
 */
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)

  // Content-Type을 직접 넣지 않는다(브라우저가 boundary 포함해 설정).
  const res = await authFetch(`${API_BASE_URL}/api/v1/files/chat/images`, {
    method: 'POST',
    body: form,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `이미지 업로드 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

/**
 * 서버가 주는 상대 경로("/uploads/...")를 브라우저에서 바로 열 수 있는 절대 URL로 바꾼다.
 * 이미 http(s)/data/blob URL이면 그대로 둔다.
 * @param {string} url 원본 URL(상대 또는 절대)
 * @returns {string} 절대 URL
 */
export function toAbsoluteFileUrl(url) {
  if (!url) return url
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
