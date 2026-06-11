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
 * QnA 질문/답변 첨부 이미지 한 장을 업로드하고 메타데이터(fileId 포함)를 받는다.
 * POST /api/v1/files/qna/images  (key: file)
 * → { fileId, fileUrl, thumbnailUrl, originalFileName, contentType, fileSize, width, height }
 *
 * 받은 fileId를 질문/답변 작성 요청의 imageFileIds에 담아 전달한다.
 * @param {File} file 업로드할 이미지 파일
 * @returns {Promise<object>} 업로드 응답
 */
export async function uploadQnaImage(file) {
  const form = new FormData()
  form.append('file', file)

  const res = await authFetch(`${API_BASE_URL}/api/v1/files/qna/images`, {
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
 * 프로필 이미지 한 장을 업로드하고 메타데이터(fileUrl 포함)를 받는다.
 * POST /api/v1/files/profile/images  (key: file)
 * → { fileId, fileUrl, thumbnailUrl, originalFileName, contentType, fileSize, width, height }
 *
 * 받은 fileUrl을 회원 정보 수정 요청(PATCH /api/v1/users/me)의 profileImageUrl에 담아 전달한다.
 * @param {File} file 업로드할 이미지 파일
 * @returns {Promise<object>} 업로드 응답
 */
export async function uploadProfileImage(file) {
  const form = new FormData()
  form.append('file', file)

  const res = await authFetch(`${API_BASE_URL}/api/v1/files/profile/images`, {
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
 * 업로드 전에 이미지를 백엔드/모델이 받을 수 있는 형태로 정규화한다.
 *
 * - 아이폰 HEIC/HEIF → JPEG로 변환(브라우저가 HEIC를 못 그리므로 heic2any 사용. 필요할 때만 동적 로드).
 * - 너무 큰 사진은 긴 변 기준 maxDim으로 축소 + JPEG 재인코딩(업로드 용량/속도 절감, 형식 통일).
 * - 변환/축소가 불가능하면 원본을 그대로 반환(백엔드 검증에 맡김).
 *
 * 백엔드 허용 형식이 jpeg/png/webp이고 OpenAI vision도 동일하므로, 결과를 JPEG로 통일한다.
 *
 * @param {File} file 사용자가 고른 원본 파일
 * @returns {Promise<File>} 업로드용으로 정규화된 파일
 */
export async function prepareImageForUpload(file, { maxDim = 2000, quality = 0.85 } = {}) {
  let working = file
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  const isHeic = type.includes('heic') || type.includes('heif') || /\.(heic|heif)$/.test(name)

  if (isHeic) {
    // HEIC는 대부분의 브라우저가 디코딩하지 못하므로 전용 디코더로 JPEG화한다.
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    working = new File([blob], renameExt(file.name, 'jpg'), { type: 'image/jpeg' })
  }

  // 긴 변 기준 축소 + JPEG 재인코딩. 디코딩 불가 시 working 그대로.
  try {
    const bitmap = await createImageBitmap(working)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob) return new File([blob], renameExt(working.name, 'jpg'), { type: 'image/jpeg' })
  } catch {
    /* 축소 실패 시 아래에서 working 반환 */
  }
  return working
}

/** 파일명 확장자를 바꾼다. (예: "문제.png" → "문제.jpg") */
function renameExt(fileName, ext) {
  const base = (fileName || 'image').replace(/\.[^.]+$/, '')
  return `${base}.${ext}`
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
