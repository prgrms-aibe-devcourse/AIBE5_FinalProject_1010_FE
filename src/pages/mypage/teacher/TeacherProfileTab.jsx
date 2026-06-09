import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'

export default function TeacherProfileTab({ profile, onSaved }) {
  const [form, setForm]     = useState({ education: '', career: '', awards: '', address: '', teachingStyle: '', introduction: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  useEffect(() => {
    if (profile) setForm({
      education:     profile.education     ?? '',
      career:        profile.career        ?? '',
      awards:        profile.awards        ?? '',
      address:       profile.address       ?? '',
      teachingStyle: profile.teachingStyle ?? '',
      introduction:  profile.introduction  ?? '',
    })
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await authFetch(`${API_BASE}/api/v1/teachers/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(res.statusText)
      const updated = await res.json()
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
      <h2 className="mp-block-title">프로필 관리</h2>
      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      {profile?.naegongScore != null && (
        <div className="mp-stat-row" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <div className="mp-stat-card">
            <p className="mp-stat-card__val">{profile.naegongScore}</p>
            <p className="mp-stat-card__lbl">내공 점수</p>
          </div>
          <div className="mp-stat-card">
            <p className="mp-stat-card__val">{Number(profile.totalTeachingHours ?? 0).toFixed(1)}</p>
            <p className="mp-stat-card__lbl">총 수업시간(h)</p>
          </div>
        </div>
      )}

      <div className="mp-form-grid">
        <div className="mp-field">
          <label>학력</label>
          <input type="text" value={form.education} onChange={e => set('education', e.target.value)} placeholder="예: 서울대학교 수학과 졸업" />
        </div>
        <div className="mp-field">
          <label>주소</label>
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="예: 서울 강남구" />
        </div>
        <div className="mp-field full">
          <label>경력</label>
          <textarea value={form.career} onChange={e => set('career', e.target.value)} placeholder="경력을 입력하세요" />
        </div>
        <div className="mp-field full">
          <label>수상 내역 / 자격증</label>
          <textarea value={form.awards} onChange={e => set('awards', e.target.value)} placeholder="수상 내역이나 자격증을 입력하세요" style={{ minHeight: 60 }} />
        </div>
        <div className="mp-field full">
          <label>수업 방식</label>
          <textarea value={form.teachingStyle} onChange={e => set('teachingStyle', e.target.value)} placeholder="수업 방식을 간략히 설명해주세요" style={{ minHeight: 60 }} />
        </div>
        <div className="mp-field full">
          <label>자기소개</label>
          <textarea value={form.introduction} onChange={e => set('introduction', e.target.value)} placeholder="학생들에게 자신을 소개해주세요" style={{ minHeight: 100 }} />
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
