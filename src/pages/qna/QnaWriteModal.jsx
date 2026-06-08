/**
 * @file QnaWriteModal.jsx
 * @description 질문 작성 모달입니다. 과목(백엔드 subjects)·제목·내용·이미지(여러 장)를 받아
 *              실제로 이미지를 업로드한 뒤 질문을 생성합니다. (STUDENT 권한)
 */
import { useEffect, useRef, useState } from 'react'
import { createQuestion } from '../../api/qnaApi.js'
import { prepareImageForUpload, uploadQnaImage } from '../../api/fileApi.js'

const INITIAL_FORM = { subjectId: '', title: '', body: '' }

export default function QnaWriteModal({ open, subjects = [], onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [files, setFiles] = useState([]) // 첨부 이미지 File[]
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // 과목 목록이 로드되면 기본값을 첫 과목으로 채운다.
  useEffect(() => {
    if (subjects.length > 0) {
      setForm((prev) => (prev.subjectId ? prev : { ...prev, subjectId: String(subjects[0].subjectId) }))
    }
  }, [subjects])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open, submitting])

  if (!open) return null

  const update = (key, value) => {
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (picked.length) setFiles((prev) => [...prev, ...picked])
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const resetAndClose = () => {
    setForm(INITIAL_FORM)
    setFiles([])
    setError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.subjectId) {
      setError('과목을 선택해주세요.')
      return
    }
    if (!form.title.trim()) {
      setError('질문 제목을 입력해주세요.')
      return
    }
    if (form.body.trim().length < 10) {
      setError('질문 내용을 10자 이상 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      // 첨부 이미지를 정규화(HEIC 변환·축소) 후 한 장씩 업로드해 fileId를 모은다.
      const imageFileIds = []
      for (const file of files) {
        const prepared = await prepareImageForUpload(file)
        const uploaded = await uploadQnaImage(prepared)
        imageFileIds.push(uploaded.fileId)
      }

      await createQuestion({
        subjectId: Number(form.subjectId),
        title: form.title.trim(),
        content: form.body.trim(),
        imageFileIds,
      })

      setForm(INITIAL_FORM)
      setFiles([])
      onCreated?.()
    } catch (err) {
      if (err.status === 401) setError('로그인이 필요합니다.')
      else if (err.status === 403) setError('질문 작성은 학생만 가능합니다.')
      else setError(err.message || '질문 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="qna-modal" role="dialog" aria-modal="true" aria-labelledby="qna-write-title">
      <button className="qna-modal__backdrop" type="button" aria-label="닫기" onClick={resetAndClose} />

      <form className="qna-modal__panel" onSubmit={handleSubmit}>
        <div className="qna-modal__head">
          <div>
            <span className="eyebrow sky">질문 작성</span>
            <h2 id="qna-write-title">막힌 부분을 자세히 남겨주세요</h2>
          </div>
          <button className="qna-modal__close" type="button" onClick={resetAndClose} aria-label="닫기">×</button>
        </div>

        <label className="form-group">
          <span className="form-label">과목</span>
          <select
            className="form-input"
            value={form.subjectId}
            onChange={(event) => update('subjectId', event.target.value)}
          >
            {subjects.length === 0 && <option value="">과목 불러오는 중…</option>}
            {subjects.map((subject) => (
              <option key={subject.subjectId} value={subject.subjectId}>{subject.name}</option>
            ))}
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">제목</span>
          <input
            className="form-input"
            value={form.title}
            maxLength={200}
            placeholder="예: 미적분 극값 문제에서 부호표가 헷갈립니다"
            onChange={(event) => update('title', event.target.value)}
          />
        </label>

        <label className="form-group">
          <span className="form-label">내용</span>
          <textarea
            className="form-input qna-modal__textarea"
            value={form.body}
            rows={7}
            placeholder="어디까지 풀었는지, 어느 부분에서 막혔는지 적어주세요."
            onChange={(event) => update('body', event.target.value)}
          />
        </label>

        <div className="form-group">
          <span className="form-label">이미지 첨부 (선택)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="form-input"
            onChange={(event) => {
              addFiles(event.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />
          {files.length > 0 && (
            <ul className="qna-modal__files">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} aria-label="첨부 제거">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="qna-modal__error">{error}</p>}

        <div className="qna-modal__actions">
          <button className="btn btn-ghost" type="button" onClick={resetAndClose} disabled={submitting}>취소</button>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? '등록 중…' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
