/**
 * @file QnaWriteModal.jsx
 * @description 질문 작성 모달입니다.
 */
import { useEffect, useState } from 'react'
import { qnaSubjects } from '../../data/qnaPosts.js'

const INITIAL_FORM = {
  subject: '수학',
  title: '',
  body: '',
}

export default function QnaWriteModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  const update = (key, value) => {
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('질문 제목을 입력해주세요.')
      return
    }
    if (form.body.trim().length < 10) {
      setError('질문 내용을 10자 이상 입력해주세요.')
      return
    }

    onSubmit(form)
    setForm(INITIAL_FORM)
  }

  return (
    <div className="qna-modal" role="dialog" aria-modal="true" aria-labelledby="qna-write-title">
      <button className="qna-modal__backdrop" type="button" aria-label="닫기" onClick={onClose} />

      <form className="qna-modal__panel" onSubmit={handleSubmit}>
        <div className="qna-modal__head">
          <div>
            <span className="eyebrow sky">질문 작성</span>
            <h2 id="qna-write-title">막힌 부분을 자세히 남겨주세요</h2>
          </div>
          <button className="qna-modal__close" type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <label className="form-group">
          <span className="form-label">과목</span>
          <select className="form-input" value={form.subject} onChange={(event) => update('subject', event.target.value)}>
            {qnaSubjects.filter((subject) => subject !== '전체').map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">제목</span>
          <input
            className="form-input"
            value={form.title}
            maxLength={80}
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

        {error && <p className="qna-modal__error">{error}</p>}

        <div className="qna-modal__actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>취소</button>
          <button className="btn btn-primary" type="submit">등록하기</button>
        </div>
      </form>
    </div>
  )
}
