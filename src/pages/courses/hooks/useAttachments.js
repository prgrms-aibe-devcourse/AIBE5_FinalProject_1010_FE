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
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      const settlements = await Promise.allSettled(pendingFiles.map((file) => uploadFn(file)))

      const succeeded = []
      const failedNames = []
      settlements.forEach((s, i) => {
        if (s.status === 'fulfilled') {
          succeeded.push({
            url: s.value.fileUrl,
            originalFileName: s.value.originalFileName,
            fileSize: s.value.fileSize,
            contentType: s.value.contentType,
          })
        } else {
          failedNames.push(pendingFiles[i].name)
        }
      })

      const results = [...uploaded, ...succeeded]
      setUploaded(results)
      // 성공한 파일은 pending에서 제거, 실패한 파일은 재시도할 수 있도록 유지
      setPending((prev) => prev.filter((f) => failedNames.includes(f.name)))

      if (failedNames.length > 0) {
        const msg = `다음 파일 업로드에 실패했습니다: ${failedNames.join(', ')}`
        setUploadError(msg)
        throw new Error(msg)
      }

      return results
    } finally {
      setUploading(false)
    }
  }

  return {
    pendingFiles, uploaded, uploading, uploadError,
    fileInputRef, reset, addFiles, removePending, removeUploaded, flushPending,
  }
}
