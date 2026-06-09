/**
 * @file QnaDetailPage.jsx
 * @description 질문 상세 페이지. 질문 본문/이미지, 답변 목록(채택·좋아요·이미지),
 *              답변 작성(선생님), 답변 채택(질문 작성 학생)을 백엔드 QnA API로 연동합니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  acceptAnswer,
  createAnswer,
  deleteAnswer,
  deleteQuestion,
  fetchQuestionDetail,
  formatRelativeTime,
  toggleAnswerLike,
} from '../../api/qnaApi.js'
import { prepareImageForUpload, toAbsoluteFileUrl, uploadQnaImage } from '../../api/fileApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function QnaDetailPage() {
  const { questionId } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyAnswerId, setBusyAnswerId] = useState(null)
  const [notice, setNotice] = useState('')

  const navigate = useNavigate()
  const currentUserId = getCurrentUserId()
  const role = getCurrentUserRole()
  const isTeacher = role === 'TEACHER'
  const isAdmin = role === 'ADMIN'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDetail(await fetchQuestionDetail(questionId))
    } catch (err) {
      setError(err.message || '질문을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    load()
  }, [load])

  const isAuthor = detail && currentUserId != null && currentUserId === detail.author?.userId

  const handleLike = async (answerId) => {
    if (currentUserId == null) {
      setError('좋아요는 로그인 후 가능합니다.')
      return
    }
    setBusyAnswerId(answerId)
    setError('')
    try {
      const res = await toggleAnswerLike(answerId)
      setDetail((prev) =>
        prev && {
          ...prev,
          answers: prev.answers.map((a) =>
            a.answerId === answerId ? { ...a, liked: res.liked, likeCount: res.likeCount } : a,
          ),
        },
      )
    } catch (err) {
      setError(err.message || '좋아요 처리에 실패했습니다.')
    } finally {
      setBusyAnswerId(null)
    }
  }

  const handleAccept = async (answerId) => {
    setBusyAnswerId(answerId)
    setError('')
    try {
      const res = await acceptAnswer(answerId)
      setNotice(`답변을 채택했어요. 선생님 내공 +${res.addedNaegongScore} (누적 ${res.teacherNaegongScore})`)
      await load()
    } catch (err) {
      setError(err.message || '채택에 실패했습니다.')
    } finally {
      setBusyAnswerId(null)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!window.confirm('이 질문을 삭제할까요? 등록된 답변도 함께 삭제됩니다.')) return
    setError('')
    try {
      await deleteQuestion(questionId)
      navigate('/qna')
    } catch (err) {
      setError(err.message || '질문 삭제에 실패했습니다.')
    }
  }

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('이 답변을 삭제할까요?')) return
    setBusyAnswerId(answerId)
    setError('')
    try {
      await deleteAnswer(answerId)
      await load()
    } catch (err) {
      setError(err.message || '답변 삭제에 실패했습니다.')
    } finally {
      setBusyAnswerId(null)
    }
  }

  if (loading) {
    return (
      <main className="qna-page">
        <div className="container qna-detail"><p className="qna-detail__hint">불러오는 중…</p></div>
      </main>
    )
  }

  if (!detail) {
    return (
      <main className="qna-page">
        <div className="container qna-detail">
          <h1>질문을 찾을 수 없습니다</h1>
          <p className="qna-detail__hint">{error}</p>
          <Link to="/qna" className="btn btn-secondary">목록으로</Link>
        </div>
      </main>
    )
  }

  const answers = detail.answers || []

  return (
    <main className="qna-page">
      <div className="container qna-detail">
        <Link to="/qna" className="qna-detail__back">← 질문 목록으로</Link>

        <article className="qna-detail__question">
          <div className="qna-detail__tags">
            <Badge variant="peach">{detail.subject?.name}</Badge>
            <span className={`qna-list-card__status ${detail.isResolved ? 'is-resolved' : 'is-waiting'}`}>
              {detail.isResolved ? '해결됨' : '답변 대기'}
            </span>
          </div>

          <h1 className="qna-detail__title">{detail.title}</h1>

          <div className="qna-detail__meta">
            <Avatar size="sm" color="c1">{detail.author?.name?.charAt(0) || '?'}</Avatar>
            <strong>{detail.author?.name}</strong>
            <span>{formatRelativeTime(detail.createdAt)}</span>
            <span>조회 {detail.viewCount}</span>
            {(isAuthor || isAdmin) && (
              <>
                <Link to={`/qna/${questionId}/edit`} className="qna-detail__edit">
                  질문 수정
                </Link>
                <button type="button" className="qna-detail__delete" onClick={handleDeleteQuestion}>
                  질문 삭제
                </button>
              </>
            )}
          </div>

          <p className="qna-detail__body">{detail.content}</p>

          {detail.images?.length > 0 && (
            <div className="qna-detail__images">
              {detail.images.map((image, index) => (
                <img key={image.fileId ?? index} src={toAbsoluteFileUrl(image.url)} alt={`질문 첨부 ${index + 1}`} />
              ))}
            </div>
          )}
        </article>

        {notice && <p className="qna-detail__notice">{notice}</p>}
        {error && <p className="qna-modal__error">{error}</p>}

        <section className="qna-detail__answers">
          <h2>답변 {answers.length}</h2>

          {answers.length === 0 ? (
            <p className="qna-detail__empty">아직 답변이 없습니다. 첫 답변을 기다리고 있어요.</p>
          ) : (
            answers.map((answer) => (
              <article key={answer.answerId} className={`qna-answer ${answer.isAccepted ? 'is-accepted' : ''}`}>
                <div className="qna-answer__head">
                  <Avatar size="sm" color="c5">{answer.authorName?.charAt(0) || '?'}</Avatar>
                  <strong>{answer.authorName}</strong>
                  {answer.isAccepted && <Badge variant="mint">채택됨</Badge>}
                  <span className="qna-answer__time">{formatRelativeTime(answer.createdAt)}</span>
                </div>

                <p className="qna-answer__body">{answer.content}</p>

                {answer.imageUrls?.length > 0 && (
                  <div className="qna-detail__images">
                    {answer.imageUrls.map((url, index) => (
                      <img key={index} src={toAbsoluteFileUrl(url)} alt={`답변 첨부 ${index + 1}`} />
                    ))}
                  </div>
                )}

                <div className="qna-answer__actions">
                  <button
                    type="button"
                    className={`qna-like ${answer.liked ? 'is-on' : ''}`}
                    disabled={busyAnswerId === answer.answerId}
                    onClick={() => handleLike(answer.answerId)}
                  >
                    ♥ {answer.likeCount}
                  </button>

                  {isAuthor && !detail.isResolved && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busyAnswerId === answer.answerId}
                      onClick={() => handleAccept(answer.answerId)}
                    >
                      채택하기
                    </button>
                  )}

                  {(currentUserId === answer.authorId || isAdmin) && (
                    <button
                      type="button"
                      className="qna-answer__delete"
                      disabled={busyAnswerId === answer.answerId}
                      onClick={() => handleDeleteAnswer(answer.answerId)}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>

        {isTeacher ? (
          <AnswerForm questionId={questionId} onCreated={load} />
        ) : (
          <p className="qna-detail__hint">답변은 선생님 계정만 작성할 수 있습니다.</p>
        )}
      </div>
    </main>
  )
}

/** 답변 작성 폼 (선생님 전용). 이미지 여러 장 첨부 가능. */
function AnswerForm({ questionId, onCreated }) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (picked.length) setFiles((prev) => [...prev, ...picked])
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (content.trim().length < 5) {
      setError('답변을 5자 이상 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const imageFileIds = []
      for (const file of files) {
        const prepared = await prepareImageForUpload(file)
        const uploaded = await uploadQnaImage(prepared)
        imageFileIds.push(uploaded.fileId)
      }
      await createAnswer(questionId, { content: content.trim(), imageFileIds })
      setContent('')
      setFiles([])
      onCreated?.()
    } catch (err) {
      if (err.status === 401) setError('로그인이 필요합니다.')
      else if (err.status === 403) setError('답변은 선생님만 작성할 수 있습니다.')
      else setError(err.message || '답변 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="qna-answer-form" onSubmit={handleSubmit}>
      <h3>답변 작성</h3>
      <textarea
        className="form-input qna-modal__textarea"
        rows={5}
        value={content}
        placeholder="학생이 이해할 수 있도록 풀이 과정을 설명해주세요."
        onChange={(event) => {
          setError('')
          setContent(event.target.value)
        }}
      />

      <div className="form-group">
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

      <div className="qna-answer-form__actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '등록 중…' : '답변 등록'}
        </button>
      </div>
    </form>
  )
}
