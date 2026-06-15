import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { prepareImageForUpload, uploadProfileImage, toAbsoluteFileUrl } from '../../../api/fileApi.js'
import { avatarColor } from '../../../utils/avatarColor.js'

const GENDER_LABEL = { MALE: '남성', FEMALE: '여성' }

export default function UserInfoTab({ userInfo, onSaved }) {
  const [form, setForm]           = useState({ name: '', phone: '', gender: '', birthDate: '', marketingAgreed: false, profileImageUrl: null })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]             = useState(null)
  const [editing, setEditing]     = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl]   = useState(null)
  const fileInputRef              = useRef(null)

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

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const startEdit = () => { setMsg(null); setEditing(true) }

  const cancelEdit = () => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setPendingFile(null)
    if (userInfo) setForm({
      name:            userInfo.name            ?? '',
      phone:           userInfo.phone           ?? '',
      gender:          userInfo.gender          ?? '',
      birthDate:       userInfo.birthDate       ?? '',
      marketingAgreed: userInfo.marketingAgreed ?? false,
      profileImageUrl: userInfo.profileImageUrl ?? null,
    })
    setMsg(null)
    setEditing(false)
  }

  const pickImage = () => fileInputRef.current?.click()

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setMsg(null)
    try {
      const prepared = await prepareImageForUpload(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(prepared))
      setPendingFile(prepared)
    } catch (err) {
      setMsg({ type: 'error', text: err.message || '이미지 처리에 실패했어요. 잠시 후 다시 시도해주세요.' })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setPendingFile(null)
    set('profileImageUrl', null)
    setMsg(null)
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      let profileImageUrl = form.profileImageUrl
      if (pendingFile) {
        const uploaded = await uploadProfileImage(pendingFile)
        profileImageUrl = uploaded.fileUrl
      }
      const patchRes = await authFetch(`${API_BASE}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profileImageUrl }),
      })
      const data = await patchRes.json().catch(() => ({}))
      if (!patchRes.ok) throw new Error(data.message || `저장에 실패했습니다. (${patchRes.status})`)
      const getRes = await authFetch(`${API_BASE}/api/v1/users/me`)
      if (!getRes.ok) throw new Error()
      const updated = await getRes.json()
      setPendingFile(null)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      onSaved(updated)
      setMsg({ type: 'success', text: '✓ 저장되었습니다.' })
      setEditing(false)
    } catch (err) {
      setMsg({ type: 'error', text: err.message || '저장에 실패했어요. 이름·성별·생년월일은 필수입니다.' })
    } finally {
      setSaving(false)
    }
  }

  const initial         = form.name?.[0] ?? '?'
  const displayImageUrl = previewUrl ?? (form.profileImageUrl ? toAbsoluteFileUrl(form.profileImageUrl) : null)
  const hasImage        = !!(previewUrl || form.profileImageUrl)

  if (!editing) {
    return (
      <div className="mp-block">
        <h2 className="mp-block-title">회원 정보</h2>
        {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

        {/* 프로필 이미지 표시 */}
        <div className="mp-avatar-edit" style={{ marginBottom: 20 }}>
          <div className={`mp-avatar-edit__preview ${avatarColor(form.name)}`}>
            {displayImageUrl
              ? <img src={displayImageUrl} alt="프로필" />
              : initial}
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
          <div className="mp-info-row">
            <span className="mp-info-label">이름</span>
            <span className="mp-info-value">{form.name || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">전화번호</span>
            <span className="mp-info-value">{form.phone || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">성별</span>
            <span className="mp-info-value">{GENDER_LABEL[form.gender] ?? '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">생년월일</span>
            <span className="mp-info-value">{form.birthDate || '-'}</span>
          </div>
          <div className="mp-info-row">
            <span className="mp-info-label">마케팅 수신 동의</span>
            <span className="mp-info-value">{form.marketingAgreed ? '동의' : '미동의'}</span>
          </div>
        </div>
        <div className="mp-form-actions">
          <button className="btn btn-primary" onClick={startEdit}>수정</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mp-block">
      <h2 className="mp-block-title">회원 정보</h2>
      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      {/* 프로필 이미지 편집 */}
      <div className="mp-avatar-edit">
        <div className={`mp-avatar-edit__preview ${avatarColor(form.name)}`}>
          {displayImageUrl
            ? <img src={displayImageUrl} alt="프로필" />
            : initial}
        </div>
        <div className="mp-avatar-edit__actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={pickImage} disabled={uploading || saving}>
            {uploading ? '처리 중...' : '사진 변경'}
          </button>
          {hasImage && (
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
      <div className="mp-form-actions" style={{ gap: 8 }}>
        <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving || uploading}>취소</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
