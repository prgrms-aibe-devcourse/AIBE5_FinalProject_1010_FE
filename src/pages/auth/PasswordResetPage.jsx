import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../auth/authApi.js'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!email.trim()) {
      setErrorMsg('이메일을 입력해주세요.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setErrorMsg('유효한 이메일 주소를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    fetch(`${API_BASE_URL}/api/v1/auth/password/reset/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErrorMsg(data.message || '요청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
          return
        }
        setSent(true)
      })
      .catch(() => setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div>
      <div className="auth-header">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Study Flow
        </Link>
      </div>

      <div className="auth-wrap">
        {/* 왼쪽 비주얼 패널 */}
        <div className="visual-panel">
          <span className="eyebrow yellow">🔑 비밀번호 재설정</span>
          <h2>
            걱정 마세요,<br />
            <span className="hand">금방 해결돼요</span>
          </h2>
          <p>가입하신 이메일 주소를 입력하면<br />재설정 링크를 보내드립니다.</p>

          <div className="features-mini" style={{ marginTop: 32 }}>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--peach-bg)' }}>📧</div>이메일 입력</div>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--butter-bg)' }}>📨</div>링크 발송</div>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--sky-bg)' }}>🔒</div>비밀번호 변경</div>
          </div>
        </div>

        {/* 오른쪽 폼 패널 */}
        <div className="form-panel">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h1 style={{ fontSize: 22, marginBottom: 12 }}>메일을 확인해 주세요</h1>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                <strong>{email}</strong>로<br />
                비밀번호 재설정 링크를 보냈습니다.<br />
                메일함(스팸함 포함)을 확인해 주세요.
              </p>
              <Link to="/login" className="btn btn-primary btn-full btn-lg" style={{ display: 'block' }}>
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <h1>비밀번호 재설정 <span className="hand">🔑</span></h1>
              <p className="sub">가입 시 사용한 이메일을 입력해주세요. 비밀번호를 재설정할 수 있는 링크를 보내드립니다.</p>

              <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
                <div className="form-group">
                  <label className="form-label">이메일</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
                    autoFocus
                  />
                  {errorMsg && <div className="form-field-error">{errorMsg}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={submitting}
                  style={{ marginTop: 8 }}
                >
                  {submitting ? '처리 중...' : '재설정 링크 보내기'}
                </button>
              </form>

              <div className="switch-mode" style={{ marginTop: 24 }}>
                <span>기억이 났나요?</span>
                <Link to="/login">로그인으로 돌아가기</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
