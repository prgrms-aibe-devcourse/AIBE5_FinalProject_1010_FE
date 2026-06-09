import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'

export default function UserInfoTab({ userInfo, onSaved }) {
  const [form, setForm]     = useState({ name: '', phone: '', gender: '', birthDate: '', marketingAgreed: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  useEffect(() => {
    if (userInfo) setForm({
      name:            userInfo.name            ?? '',
      phone:           userInfo.phone           ?? '',
      gender:          userInfo.gender          ?? '',
      birthDate:       userInfo.birthDate       ?? '',
      marketingAgreed: userInfo.marketingAgreed ?? false,
    })
  }, [userInfo])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await authFetch(`${API_BASE}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profileImageUrl: userInfo?.profileImageUrl ?? null }),
      })
      const updated = await authFetch(`${API_BASE}/api/v1/users/me`).then(r => r.json())
      onSaved(updated)
      setMsg({ type: 'success', text: '✓ 저장되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '저장에 실패했어요. 이름·성별·생년월일은 필수입니다.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">회원 정보</h2>
      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      <div style={{ marginBottom: 20, background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 12, padding: '4px 16px' }}>
        <div className="mp-info-row">
          <span className="mp-info-label">이메일</span>
          <span className="mp-info-value">{userInfo?.email ?? '-'}</span>
        </div>
        <div className="mp-info-row">
          <span className="mp-info-label">가입 방식</span>
          <span className="mp-info-value">{userInfo?.socialProvider ?? '-'}</span>
        </div>
      </div>

      <div className="mp-form-grid">
        <div className="mp-field">
          <label>이름 *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="이름을 입력하세요" />
        </div>
        <div className="mp-field">
          <label>전화번호</label>
          <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="'-' 없이 11자리" />
        </div>
        <div className="mp-field">
          <label>성별 *</label>
          <select value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">선택해주세요</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>
        </div>
        <div className="mp-field">
          <label>생년월일 *</label>
          <input type="text" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} placeholder="yyyy-MM-dd" />
        </div>
        <div className="mp-field full" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <input
            type="checkbox" id="u-marketing" checked={form.marketingAgreed}
            onChange={e => set('marketingAgreed', e.target.checked)}
            style={{ width: 16, height: 16, flexShrink: 0, accentColor: 'var(--teal)', cursor: 'pointer' }}
          />
          <label htmlFor="u-marketing" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer' }}>
            마케팅 수신 동의
          </label>
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
