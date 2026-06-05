import { useState, useRef } from 'react'

/**
 * 첨부파일 상태 관리 + 업로드 훅.
 * NoticeTab / BoardTab 두 탭에서 공용으로 사용.
 *
 * @param {Array} initial - 수정 시 기존 업로드 파일 목록
 */
export function useAttachments(initial = []) {
  const [pendingFiles, setPending]    = useState([])
  const [uploaded, setUploaded]       = useState(initial)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  function reset(initialUploaded = []) {
    setPending([])
    setUploaded(initialUploaded)
    setUploadError('')
  }

  function addFiles(files) {
    setPending((prev) => [...prev, ...files])
    setUploadError('')
  }

  function removePending(i) { setPending((p) => p.filter((_, idx) => idx !== i)) }
  function removeUploaded(i) { setUploaded((p) => p.filter((_, idx) => idx !== i)) }

  /**
   * 대기 중인 파일을 서버에 업로드하고 최종 첨부파일 목록을 반환.
   * @param {Function} uploadFn - (file: File) => Promise<FileUploadResponse>
   */
  async function flushPending(uploadFn) {
    if (!pendingFiles.length) return uploaded
    setUploading(true)
    setUploadError('')
    try {
      const fresh = await Promise.all(pendingFiles.map((file) => uploadFn(file)))
      const results = [
        ...uploaded,
        ...fresh.map((res) => ({
          url: res.fileUrl,
          originalFileName: res.originalFileName,
          fileSize: res.fileSize,
          contentType: res.contentType,
        })),
      ]
      setUploaded(results)
      setPending([])
      return results
    } catch (err) {
      setUploadError(err.message ?? '파일 업로드에 실패했습니다.')
      throw err
    } finally {
      setUploading(false)
    }
  }

  return {
    pendingFiles, uploaded, uploading, uploadError,
    fileInputRef, reset, addFiles, removePending, removeUploaded, flushPending,
  }
}
