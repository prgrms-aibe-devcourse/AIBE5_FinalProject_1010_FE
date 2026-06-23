import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchClassroomQuizSnapshot } from '../../../api/classroomApi.js'
import {
  connectChat,
  onSocketStatus,
  sendClassroomQuiz,
  subscribeClassroomQuiz,
  subscribeClassroomQuizResult,
} from '../../../api/chatSocket.js'

const DEFAULT_DURATION_SEC = 60

export default function ClassroomQuizPanel({ sessionId, isTeacher }) {
  const [open, setOpen] = useState(true)
  const [quiz, setQuiz] = useState(null)
  const [localSubmission, setLocalSubmission] = useState(null)
  const [answerInput, setAnswerInput] = useState('')
  const [teacherQuestion, setTeacherQuestion] = useState('')
  const [teacherAnswer, setTeacherAnswer] = useState('')
  const [durationSec, setDurationSec] = useState(DEFAULT_DURATION_SEC)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nowMs, setNowMs] = useState(Date.now())
  const autoRefreshQuizIdRef = useRef(null)
  const refreshTimerRef = useRef(null)

  const refreshSnapshot = useCallback(async () => {
    if (sessionId == null) return
    const data = await fetchClassroomQuizSnapshot(sessionId)
    const nextQuiz = data?.quiz || null
    setQuiz(nextQuiz)
    if (!nextQuiz || nextQuiz.type === 'idle') {
      setLocalSubmission(null)
      setAnswerInput('')
      autoRefreshQuizIdRef.current = null
    }
  }, [sessionId])

  useEffect(() => {
    let cancelled = false
    refreshSnapshot().catch((err) => {
      if (!cancelled) setError(err?.message || '문제풀이 상태를 불러오지 못했어요.')
    })
    return () => { cancelled = true }
  }, [refreshSnapshot])

  useEffect(() => {
    if (!quiz?.quizId || quiz.type === 'ended') return undefined
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [quiz?.quizId, quiz?.type])

  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false
    let unsubQuiz = () => {}
    let unsubResult = () => {}

    const queueRefresh = () => {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => {
        refreshSnapshot().catch(() => {})
      }, 120)
    }

    const onQuizMessage = (message) => {
      if (cancelled || !message) return
      if (message.type === 'started') {
        setQuiz(message)
        setLocalSubmission(null)
        setAnswerInput('')
        setError('')
        setOpen(true)
        autoRefreshQuizIdRef.current = null
        if (isTeacher) queueRefresh()
        return
      }
      if (message.type === 'submissionUpdate') {
        if (isTeacher) queueRefresh()
        return
      }
      if (message.type === 'ended') {
        setQuiz(message)
        setError('')
        setOpen(true)
        queueRefresh()
      }
    }

    const onPrivateResult = (message) => {
      if (cancelled || !message) return
      if (message.type === 'error') {
        setError(message.message || '문제풀이 요청 처리에 실패했어요.')
        return
      }
      if (message.type === 'submitted') {
        setLocalSubmission(message)
        setQuiz((prev) => (prev ? { ...prev, mySubmission: message } : prev))
        setError('')
      }
    }

    const resubscribe = () => {
      if (cancelled) return
      unsubQuiz()
      unsubResult()
      unsubQuiz = subscribeClassroomQuiz(sessionId, onQuizMessage)
      unsubResult = subscribeClassroomQuizResult(sessionId, onPrivateResult)
    }

    const offStatus = onSocketStatus((status) => {
      if (status === 'connected') resubscribe()
    })
    connectChat().then(resubscribe).catch(() => {
      if (!cancelled) setError('실시간 문제풀이 연결에 실패했어요.')
    })

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimerRef.current)
      unsubQuiz()
      unsubResult()
      offStatus()
    }
  }, [sessionId, isTeacher, refreshSnapshot])

  const serverOffsetMs = useMemo(() => {
    if (!quiz || typeof quiz.serverNowMs !== 'number') return 0
    return quiz.serverNowMs - Date.now()
  }, [quiz?.quizId, quiz?.serverNowMs])

  const remainingSec = useMemo(() => {
    if (!quiz?.endsAtMs || quiz.type === 'idle') return 0
    return Math.max(0, Math.ceil((quiz.endsAtMs - (nowMs + serverOffsetMs)) / 1000))
  }, [quiz?.endsAtMs, quiz?.type, nowMs, serverOffsetMs])

  const hasQuiz = !!quiz?.quizId && quiz.type !== 'idle'
  const isEnded = hasQuiz && (quiz.type === 'ended' || remainingSec <= 0)
  const isActive = hasQuiz && quiz.type === 'started' && remainingSec > 0
  const mySubmission = quiz?.mySubmission || localSubmission
  const submitted = !!mySubmission?.submitted
  const progressPercent = hasQuiz && quiz.durationSec
    ? Math.max(0, Math.min(100, (remainingSec / quiz.durationSec) * 100))
    : 0

  useEffect(() => {
    if (!hasQuiz || quiz.type !== 'started' || remainingSec > 0) return undefined
    if (autoRefreshQuizIdRef.current === quiz.quizId) return undefined
    autoRefreshQuizIdRef.current = quiz.quizId
    const id = window.setTimeout(() => {
      refreshSnapshot().catch(() => {})
    }, 350)
    return () => window.clearTimeout(id)
  }, [hasQuiz, quiz?.type, quiz?.quizId, remainingSec, refreshSnapshot])

  const publishQuiz = useCallback(async (payload) => {
    await connectChat()
    if (!sendClassroomQuiz(sessionId, payload)) {
      throw new Error('실시간 연결이 준비되지 않았어요.')
    }
  }, [sessionId])

  const handleStart = async (event) => {
    event.preventDefault()
    const question = teacherQuestion.trim()
    const answer = teacherAnswer.trim()
    if (!question || !answer) {
      setError('문제와 정답을 모두 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      await publishQuiz({
        type: 'start',
        question,
        answer,
        durationSec: Number(durationSec) || DEFAULT_DURATION_SEC,
      })
      setTeacherQuestion('')
      setTeacherAnswer('')
      setError('')
      setOpen(true)
      window.setTimeout(() => refreshSnapshot().catch(() => {}), 120)
    } catch (err) {
      setError(err?.message || '문제를 출제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const answer = answerInput.trim()
    if (!quiz?.quizId || !answer) {
      setError('답안을 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      await publishQuiz({ type: 'submit', quizId: quiz.quizId, answer })
      setLocalSubmission({ type: 'submitted', submitted: true, answer, pending: true })
      setError('')
    } catch (err) {
      setError(err?.message || '답안을 제출하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleEnd = async () => {
    if (!quiz?.quizId) return
    setBusy(true)
    try {
      await publishQuiz({ type: 'end', quizId: quiz.quizId })
      setError('')
      window.setTimeout(() => refreshSnapshot().catch(() => {}), 120)
    } catch (err) {
      setError(err?.message || '문제를 종료하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`classroom-quiz-panel ${open ? 'is-open' : 'is-collapsed'} ${isEnded ? 'is-ended' : ''}`} aria-label="실시간 문제풀이">
      <button className="cq-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span className="cq-toggle-mark">Q</span>
        <span>{open ? '문제풀이 접기' : activeLabel(hasQuiz, isEnded)}</span>
        {isActive && <strong>{formatClock(remainingSec)}</strong>}
      </button>

      {open && (
        <div className="cq-body">
          <div className="cq-head">
            <div>
              <p className="cq-eyebrow">실시간 문제풀이</p>
              <h3>{hasQuiz ? (isEnded ? '결과 확인' : '진행 중인 문제') : '문제 대기 중'}</h3>
            </div>
            {hasQuiz && (
              <div className={`cq-timer ${remainingSec <= 10 && isActive ? 'is-urgent' : ''}`}>
                {isEnded ? '종료' : formatClock(remainingSec)}
              </div>
            )}
          </div>

          {hasQuiz && (
            <div className="cq-progress" style={{ '--cq-progress': `${progressPercent}%` }}>
              <span />
            </div>
          )}

          {error && <div className="cq-alert">{error}</div>}

          {isTeacher
            ? renderTeacher({
              hasQuiz, isActive, isEnded, quiz, busy, durationSec, setDurationSec,
              teacherQuestion, setTeacherQuestion, teacherAnswer, setTeacherAnswer,
              handleStart, handleEnd,
            })
            : renderStudent({
              hasQuiz, isActive, isEnded, quiz, busy, submitted, mySubmission,
              answerInput, setAnswerInput, handleSubmit,
            })}
        </div>
      )}
    </section>
  )
}

function renderTeacher({
  hasQuiz,
  isActive,
  isEnded,
  quiz,
  busy,
  durationSec,
  setDurationSec,
  teacherQuestion,
  setTeacherQuestion,
  teacherAnswer,
  setTeacherAnswer,
  handleStart,
  handleEnd,
}) {
  return (
    <>
      {hasQuiz && (
        <div className="cq-current">
          <p className="cq-label">출제한 문제</p>
          <div className="cq-question">{quiz.question}</div>
          <div className="cq-answer-line">
            <span>정답</span>
            <strong>{quiz.answer || '스냅샷 동기화 중'}</strong>
          </div>
          <div className="cq-stat-row">
            <span>제출 {quiz.submissionCount ?? 0}</span>
            <span>정답 {quiz.correctCount ?? '-'}</span>
            <span>오답 {quiz.wrongCount ?? '-'}</span>
          </div>
          {isActive && (
            <button className="cq-secondary-btn" type="button" disabled={busy} onClick={handleEnd}>
              바로 종료하고 채점하기
            </button>
          )}
        </div>
      )}

      {(!hasQuiz || isEnded) && (
        <form className="cq-form" onSubmit={handleStart}>
          <label>
            <span>문제</span>
            <textarea
              value={teacherQuestion}
              onChange={(event) => setTeacherQuestion(event.target.value)}
              rows={3}
              placeholder="학생들에게 풀게 할 문제를 입력하세요."
            />
          </label>
          <label>
            <span>정답</span>
            <input
              value={teacherAnswer}
              onChange={(event) => setTeacherAnswer(event.target.value)}
              placeholder="채점 기준이 될 정답"
            />
          </label>
          <label>
            <span>풀이 시간</span>
            <div className="cq-duration-row">
              <input
                type="number"
                min="5"
                max="1800"
                value={durationSec}
                onChange={(event) => setDurationSec(event.target.value)}
              />
              <em>초</em>
            </div>
          </label>
          <button className="cq-primary-btn" type="submit" disabled={busy}>
            {busy ? '출제 중...' : '문제 출제하기'}
          </button>
        </form>
      )}
    </>
  )
}

function renderStudent({
  hasQuiz,
  isActive,
  isEnded,
  quiz,
  busy,
  submitted,
  mySubmission,
  answerInput,
  setAnswerInput,
  handleSubmit,
}) {
  if (!hasQuiz) {
    return (
      <div className="cq-empty">
        선생님이 문제를 출제하면 이곳에 바로 표시됩니다.
      </div>
    )
  }

  const hasResult = isEnded && typeof mySubmission?.correct === 'boolean'

  return (
    <>
      <div className="cq-current">
        <p className="cq-label">문제</p>
        <div className="cq-question">{quiz.question}</div>
      </div>

      {isActive && (
        <form className="cq-form" onSubmit={handleSubmit}>
          <label>
            <span>내 답안</span>
            <textarea
              value={submitted ? (mySubmission?.answer || answerInput) : answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              rows={2}
              placeholder="시간 안에 답안을 입력하세요."
              disabled={submitted || busy}
            />
          </label>
          <button className="cq-primary-btn" type="submit" disabled={submitted || busy}>
            {submitted ? '제출 완료' : (busy ? '제출 중...' : '답안 제출')}
          </button>
          {submitted && <p className="cq-hint">결과는 풀이 시간이 끝난 뒤 공개됩니다.</p>}
        </form>
      )}

      {isEnded && (
        <div className={`cq-result ${hasResult && mySubmission.correct ? 'is-correct' : 'is-wrong'}`}>
          {hasResult && mySubmission.correct && <Confetti />}
          <div className="cq-result-icon">{hasResult && mySubmission.correct ? 'OK' : 'NEXT'}</div>
          <strong>{hasResult ? mySubmission.message : '채점 결과를 불러오는 중입니다.'}</strong>
          <p>정답: {quiz.answer || '공개 대기 중'}</p>
          {mySubmission?.answer && <small>내 답안: {mySubmission.answer}</small>}
        </div>
      )}
    </>
  )
}

function Confetti() {
  const colors = ['#22c55e', '#14b8a6', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6']
  return (
    <div className="cq-confetti" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => {
        const x = (index - 5.5) * 16
        const y = -58 - (index % 4) * 14
        return (
          <i
            key={index}
            style={{
              '--cq-x': `${x}px`,
              '--cq-y': `${y}px`,
              '--cq-rot': `${index * 42}deg`,
              '--cq-delay': `${index * 0.025}s`,
              '--cq-color': colors[index % colors.length],
            }}
          />
        )
      })}
    </div>
  )
}

function activeLabel(hasQuiz, isEnded) {
  if (!hasQuiz) return '문제풀이'
  return isEnded ? '결과 확인' : '문제 진행 중'
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
