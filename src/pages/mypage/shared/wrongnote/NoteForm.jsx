import { useState, useEffect } from 'react'
import { toForm, toPayload } from './noteUtils.jsx'

export default function NoteForm({ subjects, initialValue, saving, onCancel, onSubmit, mode }) {
  const [form, setForm] = useState(() => toForm(initialValue))

  useEffect(() => {
    setForm(toForm(initialValue))
  }, [initialValue])

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(toPayload(form))
  }

  const canSubmit = form.title.trim() && form.questionContent.trim()

  return (
    <form className="wan-form" onSubmit={handleSubmit}>
      <div className="wan-form-head">
        <div>
          <p className="wan-kicker">{mode === 'edit' ? '오답노트 수정' : '새 오답노트'}</p>
          <h3>{mode === 'edit' ? '기록을 다듬어 저장하기' : '틀린 문제를 바로 정리하기'}</h3>
        </div>
        <button type="button" className="wan-icon-btn" onClick={onCancel} aria-label="닫기">
          ×
        </button>
      </div>

      <div className="wan-form-grid">
        <label className="wan-field wan-field--full">
          <span>제목</span>
          <input
            value={form.title}
            onChange={event => updateField('title', event.target.value)}
            placeholder="예: 등차수열 점화식 실수"
            maxLength={200}
            required
          />
        </label>

        <label className="wan-field">
          <span>과목</span>
          <select value={form.subjectId} onChange={event => updateField('subjectId', event.target.value)}>
            <option value="">과목 선택 안 함</option>
            {subjects.map(subject => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="wan-field">
          <span>태그</span>
          <input
            value={form.tagsText}
            onChange={event => updateField('tagsText', event.target.value)}
            placeholder="쉼표로 구분"
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>문제 내용</span>
          <textarea
            value={form.questionContent}
            onChange={event => updateField('questionContent', event.target.value)}
            placeholder="문제, 조건, 내가 헷갈린 지점을 적어주세요."
            required
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>정답 / 풀이</span>
          <textarea
            value={form.answerContent}
            onChange={event => updateField('answerContent', event.target.value)}
            placeholder="정답이나 선생님/AI 답변을 정리해두세요."
          />
        </label>

        <label className="wan-field">
          <span>틀린 이유</span>
          <textarea
            value={form.wrongReason}
            onChange={event => updateField('wrongReason', event.target.value)}
            placeholder="계산 실수, 개념 착각, 조건 누락 등"
          />
        </label>

        <label className="wan-field">
          <span>다음 풀이 전략</span>
          <textarea
            value={form.explanation}
            onChange={event => updateField('explanation', event.target.value)}
            placeholder="다음에 같은 유형을 만나면 어떻게 풀지"
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>메모</span>
          <textarea
            value={form.memo}
            onChange={event => updateField('memo', event.target.value)}
            placeholder="복습 일정이나 추가로 기억할 내용을 적어두세요."
          />
        </label>
      </div>

      <div className="wan-form-actions">
        <button type="button" className="wan-btn wan-btn--ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="wan-btn wan-btn--primary" disabled={!canSubmit || saving}>
          {saving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '작성 완료'}
        </button>
      </div>
    </form>
  )
}
