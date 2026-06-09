import { useState, useEffect } from 'react'
import { authFetch } from '../../../api/authFetch.js'
import { API_BASE } from '../../../api/config.js'

const DOC_LABEL         = { DIPLOMA: '졸업증명서', ID_CARD: '신분증', TEACHER_CERTIFICATE: '교원자격증' }
const VERIFY_STATUS_LBL = { PENDING: '검토 중', APPROVED: '승인됨', REJECTED: '반려됨' }

export default function VerifyTab() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState({ documentType: '', description: '' })
  const [submitting, setSubmitting]       = useState(false)
  const [msg, setMsg]                     = useState(null)

  const reload = () =>
    authFetch(`${API_BASE}/api/v1/teachers/me/verifications?size=20`)
      .then(r => r.json())
      .then(data => { setVerifications(data.content ?? []); setLoading(false) })
      .catch(() => setLoading(false))

  useEffect(() => { reload() }, [])

  const submit = async () => {
    if (!form.documentType) { setMsg({ type: 'error', text: '서류 유형을 선택해주세요.' }); return }
    setMsg(null); setSubmitting(true)
    try {
      await authFetch(`${API_BASE}/api/v1/teachers/me/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: form.documentType, description: form.description || null }),
      })
      await reload()
      setShowForm(false)
      setForm({ documentType: '', description: '' })
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
        <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(v => !v); setMsg(null) }}>
          {showForm ? '취소' : '+ 신청'}
        </button>
      </div>

      {msg && <div className={`mp-alert ${msg.type}`}>{msg.text}</div>}

      {showForm && (
        <div className="mp-verify-form-panel">
          <div className="mp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="mp-field">
              <label>서류 유형 *</label>
              <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}>
                <option value="">선택해주세요</option>
                {Object.entries(DOC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="mp-field">
              <label>설명 (선택)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="서류에 대한 추가 설명"
                style={{ minHeight: 56 }}
              />
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 600, marginTop: 10 }}>
            ※ 파일 첨부 기능은 추후 업데이트 예정입니다.
          </p>
          <div className="mp-form-actions" style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={submitting}>
              {submitting ? '신청 중...' : '인증 신청'}
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
                <span style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 600 }}>
                  {new Date(v.createdAt).toLocaleDateString('ko-KR')}
                </span>
                <span className={`mp-verify-status ${v.status}`}>{VERIFY_STATUS_LBL[v.status] ?? v.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
