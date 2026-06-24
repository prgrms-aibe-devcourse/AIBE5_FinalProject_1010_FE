import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'
import { uploadVerificationDocument, prepareImageForUpload } from '../../../api/fileApi.js'
import UniversityPicker from './UniversityPicker.jsx'

const DOC_LABEL = { DIPLOMA: '졸업증명서', STUDENT_ID: '학생증', ENROLLMENT_CERT: '재학증명서', TEACHER_CERTIFICATE: '교원자격증' }
const VERIFY_STATUS_LBL = { PENDING: '검토 중', APPROVED: '승인됨', REJECTED: '반려됨' }

const EMPTY_FORM = { documentType: '', description: '', career: '', major: '', admissionYear: '' }

export default function VerifyTab({ profile }) {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showUniPicker, setShowUniPicker] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)   // { file: File, name: string } — 저장 전 로컬 보관
  const [preparing, setPreparing] = useState(false)  // HEIC 변환 중

  const reload = () =>
    authFetch(`${API_BASE}/api/v1/teachers/me/verifications?size=20`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(data => { setVerifications(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))

  useEffect(() => { reload() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // 파일 선택 시 로컬 처리만 수행 (서버 업로드는 인증 신청 제출 시점에 진행)
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''   // 같은 파일 재선택 허용
    if (!file) return
    setMsg(null); setPreparing(true)
    try {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      const prepared = isPdf ? file : await prepareImageForUpload(file)
      setPendingFile({ file: prepared, name: file.name })
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || '파일 처리에 실패했어요.' })
    } finally {
      setPreparing(false)
    }
  }

  const resetForm = () => { setForm(EMPTY_FORM); setPendingFile(null) }

  const submit = async () => {
    if (!form.documentType) { setMsg({ type: 'error', text: '서류 유형을 선택해주세요.' }); return }
    if (!pendingFile) { setMsg({ type: 'error', text: '서류 파일을 첨부해주세요.' }); return }
    setMsg(null); setSubmitting(true)
    try {
      // 신청 제출 시점에 업로드 → 이탈·재선택으로 인한 고아 파일 방지
      const uploaded = await uploadVerificationDocument(pendingFile.file)
      const res = await authFetch(`${API_BASE}/api/v1/teachers/me/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: form.documentType,
          fileAssetId: uploaded.fileId,
          description: form.description || null,
          career: form.career || null,
          major: form.major || null,
          admissionYear: form.admissionYear || null,
        }),
      })
      if (!res.ok) throw new Error(res.status)
      await reload()
      setShowForm(false)
      resetForm()
      setMsg({ type: 'success', text: '✓ 인증 신청이 접수되었습니다.' })
    } catch {
      setMsg({ type: 'error', text: '신청에 실패했어요. 다시 시도해주세요.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mp-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="mp-block-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>인증</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          if (!showForm) {
            setForm(f => ({
              ...f,
              career: profile?.career ?? '',
              major: profile?.major ?? '',
              admissionYear: profile?.admissionYear ?? '',
            }))
          }
          setPendingFile(null)
          setShowForm(v => !v)
          setMsg(null)
        }}>
          {showForm ? '취소' : '+ 신청'}
        </button>
      </div>

      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      {showForm && (
        <div className="mp-verify-form-panel">
          <div className="mp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="mp-field">
              <label>서류 유형 *</label>
              <select value={form.documentType} onChange={e => set('documentType', e.target.value)}>
                <option value="">선택해주세요</option>
                {Object.entries(DOC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="mp-field">
              <label>서류 파일 *</label>
              {pendingFile ? (
                <div className="mp-file-chip">
                  <span className="mp-file-chip__name">📎 {pendingFile.name}</span>
                  <button
                    type="button"
                    className="mp-file-chip__remove"
                    onClick={() => setPendingFile(null)}
                    aria-label="첨부 제거"
                  >×</button>
                </div>
              ) : (
                <label className={`mp-file-drop${preparing ? ' is-uploading' : ''}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFile}
                    disabled={preparing}
                    style={{ display: 'none' }}
                  />
                  <span>{preparing ? '처리 중...' : '+ 파일 선택 (PDF · 이미지)'}</span>
                </label>
              )}
              <p className="mp-field-hint">PDF 또는 이미지(JPG·PNG·WEBP), 최대 20MB</p>
            </div>
            <div className="mp-field">
              <label>대학교</label>
              <button
                type="button"
                className={`rp-trigger${form.career ? '' : ' rp-trigger--empty'}`}
                onClick={() => setShowUniPicker(true)}
              >
                <span>{form.career || '대학교를 검색해주세요'}</span>
                <span className="rp-trigger__arrow" aria-hidden="true">▾</span>
              </button>
            </div>
            {showUniPicker && (
              <UniversityPicker
                value={form.career}
                onChange={v => set('career', v)}
                onClose={() => setShowUniPicker(false)}
              />
            )}
            <div className="mp-field">
              <label>전공</label>
              <input
                type="text"
                value={form.major}
                onChange={e => set('major', e.target.value)}
                placeholder="예: 수학교육과"
              />
            </div>
            <div className="mp-field">
              <label>학번</label>
              <input
                type="text"
                value={form.admissionYear}
                onChange={e => set('admissionYear', e.target.value)}
                placeholder="예: 26학번"
              />
            </div>
            <div className="mp-field">
              <label>설명 (선택)</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="서류에 대한 추가 설명"
                style={{ minHeight: 56 }}
              />
            </div>
          </div>
          <div className="mp-form-actions" style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={submitting || preparing}>
              {submitting ? '처리 중...' : '인증 신청'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="mp-loading">불러오는 중...</div>}
      {!loading && verifications.length === 0 && !showForm && (
        <div className="mp-empty">
          <p className="mp-empty__text">인증 신청 내역이 없어요</p>
        </div>
      )}
      {!loading && verifications.length > 0 && (
        <div className="mp-verify-list">
          {verifications.map(v => (
            <div className="mp-verify-item" key={v.id}>
              <div>
                <p className="mp-verify-doc">{DOC_LABEL[v.documentType] ?? v.documentType}</p>
                {v.description && <p className="mp-verify-desc">{v.description}</p>}
                {v.rejectedReason && (
                  <p style={{ fontSize: 12, color: 'var(--coral-dark)', fontWeight: 600, marginTop: 4 }}>
                    반려 사유: {v.rejectedReason}
                  </p>
                )}
              </div>
              <div className="mp-verify-meta">
                {v.createdAt && (
                  <span style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 600 }}>
                    {new Date(v.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
                <span className={`mp-verify-status ${v.status}`}>{VERIFY_STATUS_LBL[v.status] ?? v.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
