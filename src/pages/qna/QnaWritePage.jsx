/**
 * @file QnaWritePage.jsx
 * @description 질문 작성/수정 겸용 페이지.
 *              - 작성: /qna/write
 *              - 수정: /qna/:questionId/edit
 *              본문은 티스토리식 에디터(QnaRichEditor)로 글을 쓰다가 커서 위치에 사진을 바로 넣는다.
 *              제출 시 에디터를 blocks + 평문 content로 직렬화해 전송한다.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createQuestion, fetchQuestionDetail, updateQuestion } from '../../api/qnaApi.js'
import { fetchSubjects } from '../../api/subjectApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'
import QnaRichEditor from './QnaRichEditor.jsx'

const TITLE_MAX = 200

export default function QnaWritePage() {
  const navigate = useNavigate()
  const { questionId } = useParams()
  const isEdit = Boolean(questionId)

  const editorRef = useRef(null)
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ subjectId: '', title: '' })
  const [initial, setInitial] = useState(null) // 에디터 초기 내용(수정 모드)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(isEdit)
  const [error, setError] = useState('')

  // 과목 목록 로드 (작성·수정 공통)
  useEffect(() => {
    fetchSubjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        setSubjects(arr)
        if (arr.length > 0) {
          setForm((prev) => (prev.subjectId ? prev : { ...prev, subjectId: String(arr[0].subjectId) }))
        }
      })
      .catch(() => setSubjects([]))
  }, [])

  // 수정 모드: 기존 질문을 불러와 폼·에디터 초기값을 채운다.
  useEffect(() => {
    if (!isEdit) return
    let active = true
    setLoadingDetail(true)
    fetchQuestionDetail(questionId)
      .then((detail) => {
        if (!active) return
        const myId = getCurrentUserId()
        const isAdmin = getCurrentUserRole() === 'ADMIN'
        if (detail.author?.userId !== myId && !isAdmin) {
          setError('본인이 작성한 질문만 수정할 수 있습니다.')
          return
        }
        setForm({
          subjectId: detail.subject?.subjectId != null ? String(detail.subject.subjectId) : '',
          title: detail.title ?? '',
        })
        setInitial({ blocks: detail.blocks, content: detail.content, images: detail.images })
      })
      .catch((err) => {
        if (active) setError(err.message || '질문을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoadingDetail(false)
      })
    return () => {
      active = false
    }
  }, [isEdit, questionId])

  const update = (key, value) => {
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.subjectId) return setError('과목을 선택해주세요.')
    if (!form.title.trim()) return setError('질문 제목을 입력해주세요.')

    setSubmitting(true)
    setError('')
    try {
      const { blocks, content } = await editorRef.current.extract()
      if (content.trim().length < 10) {
        setError('질문 내용을 10자 이상 입력해주세요. (사진만 등록할 수는 없어요)')
        setSubmitting(false)
        return
      }

      const payload = { subjectId: Number(form.subjectId), title: form.title.trim(), content, blocks }
      if (isEdit) {
        await updateQuestion(questionId, payload)
        navigate(`/qna/${questionId}`)
      } else {
        await createQuestion(payload)
        navigate('/qna')
      }
    } catch (err) {
      if (err.status === 401) setError('로그인이 필요합니다.')
      else if (err.status === 403) setError(isEdit ? '본인이 작성한 질문만 수정할 수 있습니다.' : '질문 작성은 학생만 가능합니다.')
      else setError(err.message || (isEdit ? '질문 수정에 실패했습니다.' : '질문 등록에 실패했습니다.'))
      setSubmitting(false)
    }
  }

  const backTo = isEdit ? `/qna/${questionId}` : '/qna'

  if (loadingDetail) {
    return (
      <main className="qna-page qna-write">
        <section className="qna-write__body container">
          <p className="qna-detail__hint">불러오는 중…</p>
        </section>
      </main>
    )
  }

  return (
    <main className="qna-page qna-write">
      <section className="qna-write__hero">
        <div className="container">
          <button type="button" className="qna-write__back" onClick={() => navigate(backTo)}>
            ← {isEdit ? '질문으로 돌아가기' : '질문게시판으로'}
          </button>
          <span className="qna-hero__label">{isEdit ? '질문 수정' : '질문 작성'}</span>
          {isEdit ? (
            <h1>질문을 <span className="hand">다듬어</span> 볼까요</h1>
          ) : (
            <h1>막힌 문제를 <span className="hand">자세히</span> 남겨주세요</h1>
          )}
          <p>글을 쓰다가 원하는 위치에 사진을 바로 넣어보세요. 사진은 글자처럼 옮기거나 지울 수 있어요.</p>
        </div>
      </section>

      <section className="qna-write__body container">
        <form className="qna-write__form" onSubmit={handleSubmit}>
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
              maxLength={TITLE_MAX}
              placeholder="예: 미적분 극값 문제에서 부호표가 헷갈립니다"
              onChange={(event) => update('title', event.target.value)}
            />
            <span className="qna-write__counter">{form.title.length}/{TITLE_MAX}</span>
          </label>

          <div className="form-group">
            <span className="form-label">내용</span>
            <QnaRichEditor ref={editorRef} initial={initial} />
          </div>

          {error && <p className="qna-modal__error">{error}</p>}

          <div className="qna-write__actions">
            <button className="btn btn-ghost" type="button" onClick={() => navigate(backTo)} disabled={submitting}>
              취소
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? (isEdit ? '수정 중…' : '등록 중…') : isEdit ? '수정 완료' : '질문 등록하기'}
            </button>
          </div>
        </form>

        <aside className="qna-write__tips">
          <h2>좋은 질문 작성 팁</h2>
          <ul>
            <li>막힌 지점을 구체적으로 적을수록 정확한 답변을 받아요.</li>
            <li>사진은 설명하려는 글 바로 옆/아래에 넣으면 이해가 빨라요.</li>
            <li>이미지를 붙여넣기(Ctrl+V)하거나 끌어다 놓아도 됩니다.</li>
            <li>과목을 정확히 선택하면 관련 선생님께 더 잘 노출돼요.</li>
          </ul>
          <div className="qna-write__notice">
            질문 작성은 <strong>학생 계정</strong>만 가능합니다.
          </div>
        </aside>
      </section>
    </main>
  )
}
