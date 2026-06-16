import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { fetchSubjects } from '../../../api/subjectApi.js'
import RegionPicker from './RegionPicker.jsx'

export default function TeacherProfileTab({ profile, onSaved }) {
  const [form, setForm]         = useState({ address: '', teachingStyle: '', introduction: '', specialtySubjectIds: [] })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)
  const [editing, setEditing]   = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [subjects, setSubjects] = useState([])

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

  const startEdit = () => { setMsg(null); setEditing(true) }

  const cancelEdit = () => {
    if (profile) setForm({
      address:       profile.address       ?? '',
      teachingStyle: profile.teachingStyle ?? '',
      introduction:  profile.introduction  ?? '',
      specialtySubjectIds: (profile.specialtySubjects ?? []).map(s => s.subjectId),
    })
    setShowPicker(false)
    setMsg(null)
    setEditing(false)
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await authFetch(`${API_BASE}/api/v1/teachers/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const detail = body?.message
          ? body.message
          : body?.errors
            ? JSON.stringify(body.errors)
            : `서버 오류 (${res.status})`
        throw new Error(detail)
      }
      const updated = await res.json()
      onSaved(updated)
      setMsg({ type: 'success', text: '✓ 저장되었습니다.' })
      setEditing(false)
    } catch (e) {
      setMsg({ type: 'error', text: `저장에 실패했어요. ${e.message}` })
    } finally {
      setSaving(false)
    }
  }

  const selectedSubjectNames = subjects
    .filter(s => form.specialtySubjectIds.includes(s.subjectId))
    .map(s => s.name)
    .join(', ')

  if (!editing) {
    return (
      <div className="mp-block">
        <h2 className="mp-block-title">프로필 관리</h2>
        {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

        <div style={{ marginBottom: 20, background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 12, padding: '4px 16px' }}>
          <div className="mp-info-row">
            <span className="mp-info-label">대학교</span>
            <span className="mp-info-value">{profile?.career || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">전공</span>
            <span className="mp-info-value">{profile?.major || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">학번</span>
            <span className="mp-info-value">{profile?.admissionYear || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">활동 지역</span>
            <span className="mp-info-value">{form.address || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">전문 과목</span>
            <span className="mp-info-value">{selectedSubjectNames || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">자기소개</span>
            <span className="mp-info-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{form.introduction || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">수업 방식</span>
            <span className="mp-info-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{form.teachingStyle || '-'}</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, marginBottom: 16 }}>
          대학교·전공·학번은 <strong>선생님 인증</strong> 메뉴에서 수정 요청할 수 있습니다.
        </p>
        <div className="mp-form-actions">
          <button className="btn btn-primary" onClick={startEdit}>수정</button>
        </div>
      </div>
    )
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
          <textarea value={form.introduction} onChange={e => set('introduction', e.target.value)} placeholder="학생들에게 자신을 소개해주세요. 경험, 교육 철학, 강점 등을 자유롭게 적어주세요." style={{ minHeight: 320 }} />
        </div>
        <div className="mp-field full">
          <label>수업 방식</label>
          <textarea value={form.teachingStyle} onChange={e => set('teachingStyle', e.target.value)} placeholder="수업을 어떻게 진행하는지 자세히 설명해주세요. 진도 방식, 문제 풀이 접근법, 피드백 방법 등을 구체적으로 적을수록 학생들에게 신뢰를 줄 수 있어요." style={{ minHeight: 320 }} />
        </div>
      </div>

      <div className="mp-form-actions" style={{ gap: 8 }}>
        <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>취소</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
