import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../auth/authApi.js'

export default function PasswordResetConfirmPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="auth-standalone-wrap">
        <div className="auth-standalone-card">
          <div className="auth-standalone-icon">⚠️</div>
          <h2 className="auth-standalone-title">유효하지 않은 링크</h2>
          <p className="auth-standalone-desc">비밀번호 재설정 링크가 올바르지 않습니다.<br />이메일에서 링크를 다시 확인해 주세요.</p>
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('/login')}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="auth-standalone-wrap">
        <div className="auth-standalone-card">
          <div className="auth-standalone-icon">✅</div>
          <h2 className="auth-standalone-title">비밀번호가 변경되었습니다</h2>
          <p className="auth-standalone-desc">새 비밀번호로 로그인해 주세요.</p>
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('/login')}>
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!password) { setErrorMsg('새 비밀번호를 입력해주세요.'); return }
    if (password.length < 8) { setErrorMsg('비밀번호는 8자 이상이어야 합니다.'); return }
    if (password !== passwordConfirm) { setErrorMsg('비밀번호가 일치하지 않습니다.'); return }

    setSubmitting(true)
    fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password, newPasswordConfirm: passwordConfirm }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErrorMsg(data.message || '비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.')
          return
        }
        setDone(true)
      })
      .catch(() => setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="auth-standalone-wrap">
      <div className="auth-standalone-card">
        <div className="auth-standalone-icon">🔒</div>
        <h2 className="auth-standalone-title">새 비밀번호 설정</h2>
        <p className="auth-standalone-desc">사용할 새 비밀번호를 입력해 주세요.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 24 }}>
          <div className="form-group">
            <label className="form-label">새 비밀번호</label>
            <input
              type="password"
              className="form-input"
              placeholder="8자 이상 입력"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
              autoFocus
            />
            {password.length > 0 && password.length < 8 && (
              <div className="form-field-error">비밀번호는 8자 이상이어야 합니다.</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">새 비밀번호 확인</label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호를 한 번 더 입력"
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setErrorMsg('') }}
            />
            {passwordConfirm && password !== passwordConfirm && (
              <div className="form-field-error">비밀번호가 일치하지 않습니다.</div>
            )}
          </div>

          {errorMsg && (
            <div className="auth-error-box">{errorMsg}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? '처리 중...' : '비밀번호 재설정'}
          </button>
        </form>
      </div>
    </div>
  )
}
