import { useState, useEffect } from 'react'
import {
  fetchWrongAnswerPracticeRecommendations,
  viewWrongAnswerNoteAnswer,
  recordWrongAnswerNoteReview,
} from '../../../../api/wrongAnswerNoteApi.js'
import { subjectNameOf, formatDate, SOURCE_LABEL, NoteContent } from './noteUtils.jsx'

const REVIEW_OPTIONS = [
  { result: 'CORRECT', label: '맞았어요', description: '다음 복습 간격을 늘립니다.' },
  { result: 'UNSURE', label: '헷갈려요', description: '조금 이른 시점에 다시 보여줍니다.' },
  { result: 'INCORRECT', label: '틀렸어요', description: '어려운 문제로 보고 빠르게 다시 추천합니다.' },
]

export default function PracticeMode({ subjects, defaultSubjectId, onClose, onPracticeChanged }) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '')
  const [candidates, setCandidates] = useState([])
  const [currentNote, setCurrentNote] = useState(null)
  const [answerVisible, setAnswerVisible] = useState(false)
  const [answerDetail, setAnswerDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answerLoading, setAnswerLoading] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewRecorded, setReviewRecorded] = useState('')
  const [error, setError] = useState('')
  const [practiceNotice, setPracticeNotice] = useState('')
  const [solvedCount, setSolvedCount] = useState(0)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    setPracticeNotice('')
    setAnswerVisible(false)
    setAnswerDetail(null)
    setReviewRecorded('')
    setSolvedCount(0)

    fetchWrongAnswerPracticeRecommendations({
      subjectId: subjectId ? Number(subjectId) : null,
      size: 10,
    })
      .then(data => {
        if (ignore) return
        const nextCandidates = Array.isArray(data) ? data : []
        setCandidates(nextCandidates)
        setCurrentNote(nextCandidates[0] ?? null)
      })
      .catch(err => {
        if (!ignore) {
          setCandidates([])
          setCurrentNote(null)
          setError(err.message || '복습 문제를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [subjectId])

  function resetAnswerState() {
    setAnswerVisible(false)
    setAnswerDetail(null)
    setReviewRecorded('')
    setPracticeNotice('')
  }

  async function refillRecommendations(excludeId) {
    setLoading(true)
    setError('')
    try {
      const data = await fetchWrongAnswerPracticeRecommendations({
        subjectId: subjectId ? Number(subjectId) : null,
        size: 10,
      })
      const nextCandidates = Array.isArray(data) ? data : []
      const filtered = excludeId && nextCandidates.length > 1
        ? nextCandidates.filter(note => note.id !== excludeId)
        : nextCandidates

      if (filtered.length === 1 && filtered[0].id === excludeId) {
        // 복습할 문제가 1개밖에 없고 이미 방금 풀었던 문제라면
        setCandidates([])
        setCurrentNote(null)
        setPracticeNotice('모든 문제를 풀었습니다.')
      } else {
        setCandidates(filtered)
        setCurrentNote(filtered[0] ?? null)
      }
    } catch (err) {
      setCandidates([])
      setCurrentNote(null)
      setError(err.message || '복습 문제를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleNext() {
    const previousId = currentNote?.id
    resetAnswerState()

    const remaining = candidates.filter(note => note.id !== previousId)
    if (remaining.length > 0) {
      setCandidates(remaining)
      setCurrentNote(remaining[0])
      return
    }

    await refillRecommendations(previousId)
  }

  async function handleViewAnswer() {
    if (!currentNote || answerLoading) return
    setAnswerLoading(true)
    setError('')
    setPracticeNotice('')
    try {
      const data = await viewWrongAnswerNoteAnswer(currentNote.id)
      setAnswerDetail(data)
      setCurrentNote(prev => prev ? {
        ...prev,
        answerViewCount: data.answerViewCount,
        lastReviewedAt: data.lastReviewedAt,
        nextReviewAt: data.nextReviewAt,
      } : prev)
      setAnswerVisible(true)
      onPracticeChanged?.()
    } catch (err) {
      setError(err.message || '답안을 불러오지 못했습니다.')
    } finally {
      setAnswerLoading(false)
    }
  }

  async function handleRecordReview(result) {
    if (!currentNote || reviewSaving || reviewRecorded) return
    setReviewSaving(true)
    setError('')
    try {
      await recordWrongAnswerNoteReview(currentNote.id, { result })
      setReviewRecorded(result)
      setSolvedCount(count => count + 1)
      setPracticeNotice('복습 결과를 저장했습니다.')
      onPracticeChanged?.()
    } catch (err) {
      setError(err.message || '복습 결과 저장에 실패했습니다.')
    } finally {
      setReviewSaving(false)
    }
  }

  const selectedSubjectName = subjectId ? subjectNameOf(subjects, subjectId) : '전체 과목'
  const currentReviewedAt = currentNote ? formatDate(currentNote.lastReviewedAt) : ''
  const currentNextReviewAt = currentNote ? formatDate(currentNote.nextReviewAt) : ''
  const answerSource = answerDetail || currentNote || {}

  return (
    <div className="wan-practice">
      <div className="wan-practice-head">
        <div>
          <p className="wan-kicker">Practice Mode</p>
          <h3>오답노트 문제풀이</h3>
          <p>오래전에 기록했거나 다시 헷갈릴 만한 문제를 골라 답안은 숨기고 보여줍니다.</p>
        </div>
        <button type="button" className="wan-icon-btn" onClick={onClose} aria-label="문제풀이 닫기">
          ×
        </button>
      </div>

      <div className="wan-practice-tools">
        <label>
          <span>과목 선택</span>
          <select value={subjectId} onChange={event => setSubjectId(event.target.value)}>
            <option value="">전체 과목</option>
            {subjects.map(subject => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <div className="wan-practice-meter">
          <span>{selectedSubjectName}</span>
          <strong>{candidates.length.toLocaleString()}개 추천</strong>
          <em>{solvedCount}문제 풀이</em>
        </div>
      </div>

      {loading && <div className="mp-loading">복습 문제를 고르는 중...</div>}
      {!loading && error && <p className="mp-feedback mp-feedback--error">{error}</p>}
      {!loading && practiceNotice && <p className="mp-feedback mp-feedback--success">{practiceNotice}</p>}
      {!loading && !error && !currentNote && (
        <div className="mp-empty">
          <p className="mp-empty__text">이 과목에 풀 수 있는 오답노트가 없습니다.</p>
        </div>
      )}

      {!loading && currentNote && (
        <article className="wan-practice-card">
          <div className="wan-practice-card__top">
            <div>
              <div className="wan-meta-row">
                <span className="wan-subject-chip">{currentNote.subjectName || '과목 없음'}</span>
                {currentReviewedAt ? <span>마지막 복습 {currentReviewedAt}</span> : <span>아직 미복습</span>}
                {currentNextReviewAt && <span>다음 복습 {currentNextReviewAt}</span>}
                <span>{SOURCE_LABEL[currentNote.sourceType] ?? currentNote.sourceType}</span>
              </div>
              <h4>{currentNote.title}</h4>
            </div>
            <button type="button" className="wan-btn wan-btn--ghost" onClick={handleNext}>
              다른 문제
            </button>
          </div>

          <div className="wan-practice-stats">
            <span>복습 {currentNote.reviewCount ?? 0}회</span>
            <span>정답 {currentNote.correctCount ?? 0}</span>
            <span>오답 {currentNote.incorrectCount ?? 0}</span>
            <span>헷갈림 {currentNote.unsureCount ?? 0}</span>
            <span>난이도 {currentNote.difficultyScore ?? 0}</span>
          </div>

          {currentNote.recommendReason && (
            <p className="wan-practice-reason">{currentNote.recommendReason}</p>
          )}

          <div className="wan-practice-question">
            <span>문제</span>
            <NoteContent text={currentNote.questionContent} />
          </div>

          {!answerVisible ? (
            <div className="wan-answer-lock">
              <p>먼저 직접 풀어본 뒤 답안을 확인하세요.</p>
              <button type="button" className="wan-btn wan-btn--primary" onClick={handleViewAnswer} disabled={answerLoading}>
                {answerLoading ? '불러오는 중...' : '답안 보기'}
              </button>
            </div>
          ) : (
            <div className="wan-practice-answer">
              {answerSource.answerContent && (
                <div className="wan-detail-section">
                  <span>정답 / 풀이</span>
                  <NoteContent text={answerSource.answerContent} />
                </div>
              )}
              {answerSource.wrongReason && (
                <div className="wan-detail-section">
                  <span>틀린 이유</span>
                  <NoteContent text={answerSource.wrongReason} />
                </div>
              )}
              {answerSource.explanation && (
                <div className="wan-detail-section">
                  <span>다음 풀이 전략</span>
                  <NoteContent text={answerSource.explanation} />
                </div>
              )}
              {answerSource.memo && (
                <div className="wan-detail-section">
                  <span>메모</span>
                  <NoteContent text={answerSource.memo} />
                </div>
              )}
              {!answerSource.answerContent && !answerSource.wrongReason && !answerSource.explanation && !answerSource.memo && (
                <p className="wan-practice-answer__empty">저장된 답안이 없습니다.</p>
              )}
              <div className="wan-review-actions">
                <div>
                  <strong>복습 결과 기록</strong>
                  <p>결과를 남기면 다음 추천 순서와 복습 시점에 반영됩니다.</p>
                </div>
                <div className="wan-review-buttons">
                  {REVIEW_OPTIONS.map(option => (
                    <button
                      key={option.result}
                      type="button"
                      className={`wan-review-btn ${reviewRecorded === option.result ? 'is-active' : ''}`}
                      onClick={() => handleRecordReview(option.result)}
                      disabled={reviewSaving || !!reviewRecorded}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wan-form-actions">
                <button type="button" className="wan-btn wan-btn--ghost" onClick={handleNext}>
                  다음 문제
                </button>
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
