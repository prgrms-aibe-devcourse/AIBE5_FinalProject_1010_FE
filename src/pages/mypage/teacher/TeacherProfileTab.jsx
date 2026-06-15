import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { fetchSubjects } from '../../../api/subjectApi.js'
import RegionPicker from './RegionPicker.jsx'

export default function TeacherProfileTab({ profile, onSaved }) {
  const [form, setForm]         = useState({ address: '', teachingStyle: '', introduction: '', specialtySubjectIds: [] })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [subjects, setSubjects] = useState([])

  // 전체 과목 목록 1회 로드 (전문 과목 선택지)
  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    if (profile) setForm({
      address:       profile.address       ?? '',
      teachingStyle: profile.teachingStyle ?? '',
      introduction:  profile.introduction  ?? '',
      specialtySubjectIds: (profile.specialtySubjects ?? []).map(s => s.subjectId),
    })
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleSubject = (id) => setForm(f => ({
    ...f,
    specialtySubjectIds: f.specialtySubjectIds.includes(id)
      ? f.specialtySubjectIds.filter(s => s !== id)
      : [...f.specialtySubjectIds, id],
  }))

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

      {/* 읽기 전용 인증 정보 */}
      <div className="mp-verify-form-panel">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 12 }}>
          대학교, 전공, 학번은 <strong>선생님 인증</strong> 메뉴에서 수정 요청할 수 있습니다.
        </p>
        <div className="mp-form-grid">
          <div className="mp-field">
            <label>대학교</label>
            <input type="text" value={profile?.career ?? ''} readOnly placeholder="미등록" />
          </div>
          <div className="mp-field">
            <label>전공</label>
            <input type="text" value={profile?.major ?? ''} readOnly placeholder="미등록" />
          </div>
          <div className="mp-field">
            <label>학번</label>
            <input type="text" value={profile?.admissionYear ?? ''} readOnly placeholder="미등록" />
          </div>
        </div>
      </div>

      {/* 직접 수정 가능한 필드 */}
      <div className="mp-form-grid">
        <div className="mp-field">
          <label>활동 지역</label>
          <button
            type="button"
            className={`rp-trigger${form.address ? '' : ' rp-trigger--empty'}`}
            onClick={() => setShowPicker(true)}
          >
            <span>{form.address || '지역을 선택해주세요'}</span>
            <span className="rp-trigger__arrow" aria-hidden="true">▾</span>
          </button>
        </div>
        {showPicker && (
          <RegionPicker
            value={form.address}
            onChange={v => set('address', v)}
            onClose={() => setShowPicker(false)}
          />
        )}
        <div className="mp-field full">
          <label>전문 과목 <span style={{ fontWeight: 600, color: 'var(--ink-mute)' }}>(중복 선택 가능)</span></label>
          <div className="mp-subject-chips">
            {subjects.map(s => (
              <button
                key={s.subjectId}
                type="button"
                className={`mp-subject-chip${form.specialtySubjectIds.includes(s.subjectId) ? ' active' : ''}`}
                onClick={() => toggleSubject(s.subjectId)}
              >
                {s.name}
              </button>
            ))}
            {subjects.length === 0 && (
              <span style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>과목을 불러오는 중...</span>
            )}
          </div>
        </div>
        <div className="mp-field full">
          <label>자기소개</label>
          <textarea value={form.introduction} onChange={e => set('introduction', e.target.value)} placeholder="학생들에게 자신을 소개해주세요" style={{ minHeight: 100 }} />
        </div>
        <div className="mp-field full">
          <label>수업 방식</label>
          <textarea value={form.teachingStyle} onChange={e => set('teachingStyle', e.target.value)} placeholder="수업 방식을 간략히 설명해주세요" style={{ minHeight: 60 }} />
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
