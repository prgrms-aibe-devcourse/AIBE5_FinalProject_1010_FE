import { useState } from 'react'
import { createEnrollmentRequest } from '../../../api/courseApi.js'

const EMPTY_FORM = { intro: '', goal: '', schedule: '', startWish: '', message: '' }

export default function CourseApplyModal({ courseId, teacherName, onClose }) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createEnrollmentRequest(courseId, formData)
      setDone(true)
    } catch (err) {
      setError(err.message || '신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="cd-modal-overlay" onClick={onClose}>
        <div className="cd-modal" onClick={e => e.stopPropagation()}>
          <div className="cd-modal__head">
            <h3>신청 완료</h3>
            <button className="cd-modal__close" onClick={onClose}>✕</button>
          </div>
          <div className="cd-modal__body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>신청이 전송됐어요!</p>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {teacherName ?? '선생님'}께서 확인 후 수락/거절 알림을 보내드립니다.
            </p>
          </div>
          <div className="cd-modal__foot">
            <button type="button" className="cd-btn-apply cd-btn-apply--modal" onClick={onClose}>확인</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cd-modal-overlay" onClick={onClose}>
      <div className="cd-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-modal__head">
          <h3>수업 신청하기</h3>
          <button className="cd-modal__close" onClick={onClose}>✕</button>
        </div>
        <form className="cd-modal__body" onSubmit={handleSubmit}>
          <p className="cd-modal__desc">
            {teacherName ?? '선생님'}께 신청을 보냅니다. 선생님이 확인 후 수락/거절합니다.
          </p>
          {error && <p className="cd-error">{error}</p>}
          <div className="cd-field">
            <label>자기소개 (학년·학교·현재 수준)</label>
            <textarea className="cd-textarea" name="intro" value={formData.intro} onChange={handleChange}
              placeholder="예) 한빛고 2학년, 모의고사 수학 3등급입니다." required />
          </div>
          <div className="cd-field">
            <label>학습 목표</label>
            <input className="cd-input" name="goal" value={formData.goal} onChange={handleChange}
              placeholder="예) 수능 수학 1등급 목표" required />
          </div>
          <div className="cd-field-row">
            <div className="cd-field">
              <label>희망 일정</label>
              <input className="cd-input" name="schedule" value={formData.schedule} onChange={handleChange}
                placeholder="평일 저녁 7시~" />
            </div>
            <div className="cd-field">
              <label>첫 수업 희망 시기</label>
              <input className="cd-input" name="startWish" value={formData.startWish} onChange={handleChange}
                placeholder="다음 주부터" />
            </div>
          </div>
          <div className="cd-field">
            <label>선생님께 한마디</label>
            <textarea className="cd-textarea" name="message" value={formData.message} onChange={handleChange}
              placeholder="자유롭게 메시지를 남겨주세요" />
          </div>
          <div className="cd-modal__foot">
            <button type="button" className="cd-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
            <button type="submit" className="cd-btn-apply cd-btn-apply--modal" disabled={submitting}>
              {submitting ? '신청 중...' : '신청 보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
