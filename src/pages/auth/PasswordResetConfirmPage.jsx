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
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>유효하지 않은 링크</h2>
          <p style={styles.desc}>비밀번호 재설정 링크가 올바르지 않습니다.<br />이메일에서 링크를 다시 확인해 주세요.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <h2 style={styles.title}>비밀번호가 변경되었습니다</h2>
          <p style={styles.desc}>새 비밀번호로 로그인해 주세요.</p>
          <button
            style={styles.btn}
            onClick={() => navigate('/login')}
          >
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
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>🔒</div>
        <h2 style={styles.title}>새 비밀번호 설정</h2>
        <p style={styles.desc}>사용할 새 비밀번호를 입력해 주세요.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 24 }}>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>새 비밀번호</label>
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

          <div style={styles.fieldWrap}>
            <label style={styles.label}>새 비밀번호 확인</label>
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
            <div style={styles.errorBox}>{errorMsg}</div>
          )}

          <button
            type="submit"
            style={{ ...styles.btn, marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? '처리 중...' : '비밀번호 재설정'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg, #FFFDF9)',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    border: '2.5px solid #1F2937',
    borderRadius: 20,
    boxShadow: '6px 6px 0 #1F2937',
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.7,
    margin: 0,
  },
  fieldWrap: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#dc2626',
    marginBottom: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '14px 0',
    background: '#0f172a',
    color: '#fff',
    border: '2px solid #1F2937',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '3px 3px 0 #1F2937',
    transition: 'transform 0.1s, box-shadow 0.1s',
    boxSizing: 'border-box',
  },
}
