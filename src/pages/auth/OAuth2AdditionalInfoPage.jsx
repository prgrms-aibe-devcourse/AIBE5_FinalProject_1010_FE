/**
 * @file OAuth2AdditionalInfoPage.jsx
 * @description 소셜 로그인 최초 가입 시 서비스에 필요한 추가 정보를 입력하는 페이지입니다.
 * - URL: /#/oauth2/additional-info?token={pendingSocialToken}
 * - 마운트 시 GET /api/v1/auth/social-pending 으로 소셜 제공 데이터를 받아 폼을 pre-fill 합니다.
 *   (Naver: gender/birthDate/phone 제공 / Google·Kakao: 미제공 → 빈 칸)
 * - 입력 완료 시 POST /api/v1/auth/social-signup 으로 가입을 완료하고 홈으로 이동합니다.
 */
import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { setAuthData } from '../../auth/tokenStore.js'
import { API_BASE_URL } from '../../auth/authApi.js'

export default function OAuth2AdditionalInfoPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  // 폼 상태
  const [role, setRole]                 = useState('student')  // 'student' | 'teacher'
  const [gender, setGender]             = useState('male')
  const [birthday, setBirthday]         = useState('')
  const [phone, setPhone]               = useState('')
  const [agreePolicies, setAgreePolicies]   = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')

  // 소셜 제공자가 이미 준 필드를 기억해 "소셜에서 가져온 값" 표시에 활용
  const [prefilled, setPrefilled] = useState({ gender: false, birthDate: false, phone: false })

  // 로딩 상태: pre-fill 데이터를 받아오는 동안 폼 렌더를 지연
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  // 마운트 시 소셜 제공 데이터 조회 → 있는 필드만 pre-fill
  useEffect(() => {
    if (!token) { setLoading(false); return }

    fetch(`${API_BASE_URL}/api/v1/auth/social-pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErrorMsg(data.message || '임시 세션이 만료되었습니다. 다시 소셜 로그인을 시도해 주세요.')
          return
        }

        const filled = { gender: false, birthDate: false, phone: false }

        if (data.gender) {
          setGender(data.gender === 'MALE' ? 'male' : 'female')
          filled.gender = true
        }
        if (data.birthDate) {
          setBirthday(data.birthDate)
          filled.birthDate = true
        }
        if (data.phone) {
          setPhone(data.phone)
          filled.phone = true
        }

        setPrefilled(filled)
      })
      .catch(() => {
        setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => setLoading(false))
  }, [token])

  // token이 없으면 잘못된 접근
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <p style={{ color: '#e11d48', marginBottom: 16 }}>유효하지 않은 접근입니다.</p>
          <Link to="/login" style={{ color: '#0EA5A4' }}>로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0f172a', fontWeight: 600 }}>
        소셜 정보를 불러오는 중...
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    const errors = []
    if (!birthday) errors.push('생년월일을 입력해주세요.')
    if (phone && !/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ''))) {
      errors.push('휴대폰 번호 형식을 확인해주세요. (예: 01012345678)')
    }
    if (!agreePolicies) errors.push('이용약관 및 개인정보처리방침에 동의해 주세요. (필수)')
    if (errors.length > 0) { setErrorMsg(errors.join('\n')); return }

    const payload = {
      token,
      role: role === 'student' ? 'STUDENT' : 'TEACHER',
      gender: gender === 'male' ? 'MALE' : 'FEMALE',
      birthDate: birthday,
      phone: phone.trim() || null,
      termsAgreements: [
        { termsType: 'SERVICE',   isAgreed: !!agreePolicies },
        { termsType: 'PRIVACY',   isAgreed: !!agreePolicies },
        { termsType: 'MARKETING', isAgreed: !!agreeMarketing }
      ]
    }

    setSubmitting(true)
    fetch(`${API_BASE_URL}/api/v1/auth/social-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          if (data.accessToken) {
            setAuthData(data.accessToken, data.accessExpiresIn, { name: data.name, role: data.role, userId: data.userId })
          }
          navigate('/')
        } else if (res.status >= 400 && res.status < 500) {
          setErrorMsg(data.message || '입력 정보를 다시 확인해 주세요.')
        } else {
          setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        }
      })
      .catch(() => setErrorMsg('요청 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.'))
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
          <span className="eyebrow yellow">🎉 거의 다 왔어요!</span>
          <h2>
            마지막으로<br />
            <span className="hand">몇 가지만 알려주세요</span>
          </h2>
          <p>소셜 계정으로 가입을 완료하려면<br />아래 정보가 필요합니다.</p>

          <div className="features-mini" style={{ marginTop: 32 }}>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--peach-bg)' }}>🎒</div>역할 선택</div>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--butter-bg)' }}>📋</div>기본 정보</div>
            <div className="mini-feat"><div className="ico" style={{ background: 'var(--sky-bg)' }}>✅</div>약관 동의</div>
          </div>
        </div>

        {/* 오른쪽 폼 패널 */}
        <div className="form-panel">
          <h1>추가 정보 입력 <span className="hand">✍️</span></h1>
          <p className="sub">서비스 이용에 필요한 정보를 입력해주세요.</p>

          {/* 역할 선택 */}
          <label className="form-label" style={{ marginTop: 8 }}>어떤 회원으로 가입하시나요?</label>
          <div className="role-picker">
            <RoleCard kind="student" role={role} setRole={setRole} icon="🎒" name="학생"    desc="수업을 듣고 싶어요" />
            <RoleCard kind="teacher" role={role} setRole={setRole} icon="👨‍🏫" name="선생님" desc="수업을 열고 싶어요" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* 성별 */}
            <div className="form-group">
              <label className="form-label">
                성별
                {prefilled.gender && <PrefilledBadge />}
              </label>
              <div className="gender-options">
                <label className="gender-option" style={{ marginRight: 12 }}>
                  <input type="radio" name="gender" value="male"
                    checked={gender === 'male'} onChange={() => setGender('male')} /> 남성
                </label>
                <label className="gender-option">
                  <input type="radio" name="gender" value="female"
                    checked={gender === 'female'} onChange={() => setGender('female')} /> 여성
                </label>
              </div>
            </div>

            {/* 생년월일 */}
            <div className="form-group">
              <label className="form-label">
                생년월일 <span style={{ color: '#e11d48' }}>*</span>
                {prefilled.birthDate && <PrefilledBadge />}
              </label>
              <input
                type="date"
                className="form-input"
                value={birthday}
                max={today}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            {/* 휴대폰 (선택) */}
            <div className="form-group">
              <label className="form-label">
                휴대폰 번호 <span style={{ color: '#94a3b8', fontSize: 12 }}>(선택)</span>
                {prefilled.phone && <PrefilledBadge />}
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* 약관 동의 */}
            <div className="form-bottom" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <label className="remember-me" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <input type="checkbox" checked={agreePolicies}
                  onChange={(e) => setAgreePolicies(e.target.checked)} />
                <span>이용약관 및 개인정보처리방침에 동의합니다. <strong>(필수)</strong></span>
              </label>
              <label className="remember-me" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <input type="checkbox" checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)} />
                <span>마케팅 정보 활용 및 광고성 정보 수신에 동의합니다.</span>
              </label>
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, color: '#dc2626',
                marginTop: 12, whiteSpace: 'pre-line'
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={submitting}
              style={{ marginTop: 20 }}
            >
              {submitting ? '처리중...' : '가입 완료하기'}
            </button>
          </form>

          <div className="switch-mode" style={{ marginTop: 20 }}>
            <span>소셜 로그인을 취소하시겠어요?</span>
            <Link to="/login">로그인 페이지로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 소셜 제공자로부터 자동 입력된 필드임을 나타내는 뱃지 */
function PrefilledBadge() {
  return (
    <span style={{
      marginLeft: 6,
      fontSize: 11,
      fontWeight: 600,
      color: '#0EA5A4',
      background: '#f0fdfc',
      border: '1px solid #99f6e4',
      borderRadius: 4,
      padding: '1px 6px',
      verticalAlign: 'middle'
    }}>
      소셜 자동입력
    </span>
  )
}

function RoleCard({ kind, role, setRole, icon, name, desc }) {
  const selected = role === kind
  return (
    <div className={`role-card ${selected ? 'selected' : ''}`} onClick={() => setRole(kind)}>
      <div className="role-icon">{icon}</div>
      <div className="role-name">{name}</div>
      <div className="role-desc">{desc}</div>
    </div>
  )
}
