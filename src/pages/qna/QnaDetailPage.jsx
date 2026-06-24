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
  toggleAnswerLike,
} from '../../api/qnaApi.js'
import { createWrongAnswerNote } from '../../api/wrongAnswerNoteApi.js'
import { formatRelativeTime } from '../../utils/datetime.js'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { getCurrentUserId, getCurrentUserRole } from '../../auth/currentUser.js'
import QnaRichEditor, { QnaBlockView } from './QnaRichEditor.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function QnaDetailPage() {
  const { questionId } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyAnswerId, setBusyAnswerId] = useState(null)
  const [notice, setNotice] = useState('')
  const [wrongNoteDraft, setWrongNoteDraft] = useState(null)
  const [savingWrongNote, setSavingWrongNote] = useState(false)

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

  // 채택 안내 메시지는 5초 후 자동으로 사라진다
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

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

  const handleAccept = async (answer) => {
    setBusyAnswerId(answer.answerId)
    setError('')
    try {
      const res = await acceptAnswer(answer.answerId)
      setNotice(`답변을 채택했어요. 선생님 내공 +${res.addedNaegongScore} (누적 ${res.teacherNaegongScore})`)
      setWrongNoteDraft(buildWrongNoteDraft(detail, answer))
      await load()
    } catch (err) {
      setError(err.message || '채택에 실패했습니다.')
    } finally {
      setBusyAnswerId(null)
    }
  }

  const handleCreateWrongNote = async () => {
    if (!wrongNoteDraft) return
    setSavingWrongNote(true)
    setError('')
    try {
      await createWrongAnswerNote(wrongNoteDraft)
      setNotice('채택한 답변을 오답노트에 추가했어요.')
      setWrongNoteDraft(null)
    } catch (err) {
      setError(err.message || '오답노트 추가에 실패했습니다.')
    } finally {
      setSavingWrongNote(false)
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

          {detail.blocks?.length > 0 ? (
            <QnaBlockView blocks={detail.blocks} />
          ) : (
            <>
              <p className="qna-detail__body">{detail.content}</p>
              {detail.images?.length > 0 && (
                <div className="qna-detail__images">
                  {detail.images.map((image, index) => (
                    <img key={image.fileId ?? index} src={toAbsoluteFileUrl(image.url)} alt={`질문 첨부 ${index + 1}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </article>

        {notice && <p className="qna-detail__notice">{notice}</p>}
        {wrongNoteDraft && (
          <div className="qna-wrong-note-prompt">
            <div>
              <strong>이 채택 답변을 오답노트에 추가할까요?</strong>
              <p>제목, 문제 내용, 첨부 이미지, 채택 답변을 오답노트로 복사합니다.</p>
            </div>
            <div className="qna-wrong-note-prompt__actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={savingWrongNote}
                onClick={() => setWrongNoteDraft(null)}
              >
                나중에
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={savingWrongNote}
                onClick={handleCreateWrongNote}
              >
                {savingWrongNote ? '추가 중...' : '오답노트 추가'}
              </button>
            </div>
          </div>
        )}
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

                {answer.blocks?.length > 0 ? (
                  <QnaBlockView blocks={answer.blocks} />
                ) : (
                  <>
                    <p className="qna-answer__body">{answer.content}</p>
                    {answer.images?.length > 0 && (
                      <div className="qna-detail__images">
                        {answer.images.map((image, index) => (
                          <img key={image.fileId ?? index} src={toAbsoluteFileUrl(image.url)} alt={`답변 첨부 ${index + 1}`} />
                        ))}
                      </div>
                    )}
                  </>
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
                      onClick={() => handleAccept(answer)}
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

function buildWrongNoteDraft(question, answer) {
  return {
    sourceType: 'QNA',
    sourceQuestionId: Number(question.questionId ?? question.id),
    sourceAnswerId: Number(answer.answerId ?? answer.id),
    subjectId: question.subject?.subjectId ?? question.subject?.id ?? null,
    title: question.title,
    questionContent: contentWithImages({
      content: question.content,
      blocks: question.blocks,
      images: question.images,
      imageLabel: '질문 첨부',
    }),
    answerContent: contentWithImages({
      content: answer.content,
      blocks: answer.blocks,
      images: answer.images,
      imageLabel: '답변 첨부',
    }),
    wrongReason: '질문게시판에서 채택한 답변을 오답노트로 옮겼습니다.',
    tags: ['질문게시판', question.subject?.name].filter(Boolean),
  }
}

function contentWithImages({ content, blocks, images, imageLabel }) {
  const lines = []

  if (Array.isArray(blocks) && blocks.length > 0) {
    blocks.forEach((block, index) => {
      if (block.type === 'image') {
        const url = toAbsoluteFileUrl(block.url)
        if (url) lines.push(`![${imageLabel} ${index + 1}](${url})`)
      } else if (block.text?.trim()) {
        lines.push(block.text.trim())
      }
    })
  } else {
    if (content?.trim()) lines.push(content.trim())
    ;(images ?? []).forEach((image, index) => {
      const url = toAbsoluteFileUrl(image.url)
      if (url) lines.push(`![${imageLabel} ${index + 1}](${url})`)
    })
  }

  return lines.join('\n\n')
}

/** 답변 작성 폼 (선생님 전용). 티스토리식 에디터로 글·사진을 자유롭게 배치한다. */
function AnswerForm({ questionId, onCreated }) {
  const editorRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { blocks, content } = await editorRef.current.extract()
      if (content.trim().length < 5) {
        setError('답변을 5자 이상 입력해주세요. (사진만 등록할 수는 없어요)')
        setSubmitting(false)
        return
      }
      await createAnswer(questionId, { content, blocks })
      editorRef.current.clear()
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
      <QnaRichEditor ref={editorRef} placeholder="풀이 과정을 적고, 필요한 그림은 커서 위치에 바로 넣어보세요." />

      {error && <p className="qna-modal__error">{error}</p>}

      <div className="qna-answer-form__actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '등록 중…' : '답변 등록'}
        </button>
      </div>
    </form>
  )
}
