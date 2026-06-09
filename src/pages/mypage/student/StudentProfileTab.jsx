import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { GRADE_LABEL } from '../../../utils/labels.js'

export default function StudentProfileTab({ profile, onSaved }) {
  const [form, setForm]     = useState({ goal: '', grade: '', interestSubjects: '', region: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  useEffect(() => {
    if (profile) setForm({
      goal:             profile.goal             ?? '',
      grade:            profile.grade            ?? '',
      interestSubjects: profile.interestSubjects ?? '',
      region:           profile.region           ?? '',
    })
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const updated = await authFetch(`${API_BASE}/api/v1/students/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(r => r.json())
      onSaved(updated)
      setMsg({ type: 'success', text: '✓ 저장되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '저장에 실패했어요. 다시 시도해주세요.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">내 프로필</h2>
      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}
      <div className="mp-form-grid">
        <div className="mp-field">
          <label>학년</label>
          <select value={form.grade} onChange={e => set('grade', e.target.value)}>
            <option value="">선택해주세요</option>
            {Object.entries(GRADE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="mp-field">
          <label>지역</label>
          <input type="text" value={form.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 강남구" />
        </div>
        <div className="mp-field full">
          <label>학습 목표</label>
          <textarea value={form.goal} onChange={e => set('goal', e.target.value)} placeholder="예: 수능 국어 1등급 달성" />
        </div>
        <div className="mp-field full">
          <label>관심 과목</label>
          <input type="text" value={form.interestSubjects} onChange={e => set('interestSubjects', e.target.value)} placeholder="예: 수학, 영어, 국어" />
        </div>
      </div>
      <div className="mp-form-actions">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
