import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { prepareImageForUpload, uploadProfileImage, toAbsoluteFileUrl } from '../../../api/fileApi.js'
import { avatarColor } from '../../../utils/avatarColor.js'

export default function UserInfoTab({ userInfo, onSaved }) {
  const [form, setForm]         = useState({ name: '', phone: '', gender: '', birthDate: '', marketingAgreed: false, profileImageUrl: null })
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]           = useState(null)
  const fileInputRef            = useRef(null)

  useEffect(() => {
    if (userInfo) setForm({
      name:            userInfo.name            ?? '',
      phone:           userInfo.phone           ?? '',
      gender:          userInfo.gender          ?? '',
      birthDate:       userInfo.birthDate       ?? '',
      marketingAgreed: userInfo.marketingAgreed ?? false,
      profileImageUrl: userInfo.profileImageUrl ?? null,
    })
  }, [userInfo])

  // 이미지 선택 후 저장 없이 이탈 시 브라우저 경고
  useEffect(() => {
    const dirty = form.profileImageUrl !== (userInfo?.profileImageUrl ?? null)
    const handler = (e) => { if (dirty) e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.profileImageUrl, userInfo?.profileImageUrl])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pickImage = () => fileInputRef.current?.click()

  // 파일 선택 → HEIC 변환·축소 → 업로드 → 미리보기 갱신 (저장 버튼을 눌러야 실제 반영)
  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''   // 같은 파일 재선택 허용
    if (!file) return
    setUploading(true); setMsg(null)
    try {
      const prepared = await prepareImageForUpload(file)
      const uploaded = await uploadProfileImage(prepared)
      set('profileImageUrl', uploaded.fileUrl)
    } catch (err) {
      setMsg({ type: 'error', text: err.message || '이미지 업로드에 실패했어요. 잠시 후 다시 시도해주세요.' })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => { set('profileImageUrl', null); setMsg(null) }

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const patchRes = await authFetch(`${API_BASE}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!patchRes.ok) throw new Error(patchRes.statusText)
      const getRes = await authFetch(`${API_BASE}/api/v1/users/me`)
      if (!getRes.ok) throw new Error(getRes.statusText)
      const updated = await getRes.json()
      onSaved(updated)
      setMsg({ type: 'success', text: '✓ 저장되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '저장에 실패했어요. 이름·성별·생년월일은 필수입니다.' })
    } finally {
      setSaving(false)
    }
  }

  const initial = form.name?.[0] ?? '?'

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">회원 정보</h2>
      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      {/* 프로필 이미지 편집 */}
      <div className="mp-avatar-edit">
        <div className={`mp-avatar-edit__preview ${avatarColor(form.name)}`}>
          {form.profileImageUrl
            ? <img src={toAbsoluteFileUrl(form.profileImageUrl)} alt="프로필" />
            : initial}
        </div>
        <div className="mp-avatar-edit__actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={pickImage} disabled={uploading || saving}>
            {uploading ? '업로드 중...' : '사진 변경'}
          </button>
          {form.profileImageUrl && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={removeImage} disabled={uploading || saving}>
              삭제
            </button>
          )}
          <input
            type="file" accept="image/*,.heic,.heif" ref={fileInputRef}
            onChange={onFileChange} hidden
          />
          <p className="mp-avatar-edit__hint">JPG·PNG·WEBP, 최대 10MB</p>
        </div>
      </div>

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
          <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
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
        <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
