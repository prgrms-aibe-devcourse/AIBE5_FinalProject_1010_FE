/**
 * @file LoginPage.jsx
 * @description 로그인/회원가입 화면입니다.
 * - 왼쪽은 StudyFlow 서비스 가치를 보여주는 비주얼 패널입니다.
 * - 오른쪽은 로그인/회원가입을 탭으로 전환하는 폼입니다.
 * - 현재는 데모 화면이므로 실제 인증 API 호출 대신 alert만 실행합니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * 로그인 / 회원가입 페이지.
 * - 좌측: 비주얼 패널 (학생 일러스트 + 미니 피처 카드)
 * - 우측: 탭으로 로그인/회원가입 전환되는 폼
 * - 회원가입 모드에서는 역할 선택(학생/선생님), 이름/비밀번호 확인 추가
 */
export default function LoginPage() {
  // mode는 현재 폼이 로그인인지 회원가입인지 결정합니다.
  // 실제 인증 API를 붙일 때도 이 값을 기준으로 submit 로직을 분기하면 됩니다.
  const [mode, setMode] = useState('login')   // 'login' | 'signup'

  // role은 회원가입 시 학생/선생님 중 어떤 회원 타입인지 저장합니다.
  // 추후 백엔드 회원가입 요청 body의 role 필드로 연결하면 됩니다.
  const [role, setRole] = useState('student') // 'student' | 'teacher'

  // JSX에서 조건부 렌더링을 여러 번 쓰기 때문에 boolean으로 빼두었습니다.
  const isSignup = mode === 'signup'

  return (
    <div className={isSignup ? 'mode-signup' : ''}>
      <div className="auth-header">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Study Flow
        </Link>
      </div>

      <div className="auth-wrap">

        {/* === Left visual panel === */}
        <div className="visual-panel">
          <span className="eyebrow yellow">🌱 Welcome back!</span>
          <h2>
            함께 만드는<br />
            <span className="hand">진짜 수업의 시작</span>
          </h2>
          <p>실시간 화이트보드, AI 문제 풀이, 양방향 강의로<br />새로운 학습을 시작해보세요.</p>

          <StudentSVG />

          <div className="features-mini">
            <MiniFeature icon="🎥" bg="var(--peach-bg)" text="실시간 화상" />
            <MiniFeature icon="✏️" bg="var(--butter-bg)" text="화이트보드" />
            <MiniFeature icon="🤖" bg="var(--sky-bg)" text="AI 문제풀이" />
            <MiniFeature icon="📊" bg="var(--lavender-bg)" text="통합 LMS" />
          </div>
        </div>

        {/* === Right form panel === */}
        <div className="form-panel">
          <h1>
            {isSignup ? <>환영합니다 <span className="hand">🎉</span></> : <>반가워요 <span className="hand">👋</span></>}
          </h1>
          <p className="sub">
            {isSignup ? '몇 가지 정보만 입력하면 바로 시작할 수 있어요' : '계정에 로그인하고 학습을 이어가세요'}
          </p>

          <div className="tabs">
            <div className={`tab ${!isSignup ? 'active' : ''}`} onClick={() => setMode('login')}>로그인</div>
            <div className={`tab ${isSignup ? 'active' : ''}`} onClick={() => setMode('signup')}>회원가입</div>
          </div>

          {isSignup && (
            <>
              <label className="form-label">어떤 회원으로 가입하시나요?</label>
              <div className="role-picker">
                <RoleCard kind="student" role={role} setRole={setRole} icon="🎒" name="학생" desc="수업을 듣고 싶어요" />
                <RoleCard kind="teacher" role={role} setRole={setRole} icon="👨‍🏫" name="선생님" desc="수업을 열고 싶어요" />
              </div>
            </>
          )}

          {/*
            현재 form은 데모용입니다.
            실제 구현 시 여기에서 e.preventDefault() 후 login/signup API를 호출하면 됩니다.
          */}
          <form onSubmit={(e) => { e.preventDefault(); alert('데모 페이지예요 :)') }}>
            {isSignup && (
              <div className="form-group">
                <label className="form-label">이름</label>
                <input type="text" className="form-input" placeholder="홍길동" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input type="email" className="form-input" placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            {isSignup && (
              <div className="form-group">
                <label className="form-label">비밀번호 확인</label>
                <input type="password" className="form-input" placeholder="••••••••" />
              </div>
            )}

            <div className="form-bottom">
              {isSignup
                ? <label className="remember-me" style={{ fontSize: 12 }}><input type="checkbox" /> 이용약관 및 개인정보처리방침에 동의합니다.</label>
                : <>
                    <label className="remember-me"><input type="checkbox" /> 로그인 유지</label>
                    <div><a href="#">아이디</a> · <a href="#">비밀번호 찾기</a></div>
                  </>}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg">
              {isSignup ? '회원가입 완료' : '로그인'}
            </button>
          </form>

          <div className="divider">또는 소셜로</div>

          <div className="socials">
            <button className="social-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.5 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.99 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1A6.59 6.59 0 015.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Google
            </button>
            <button className="social-btn kakao">💬 Kakao</button>
            <button className="social-btn naver"><strong>N</strong> Naver</button>
          </div>

          <div className="switch-mode">
            <span>{isSignup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(isSignup ? 'login' : 'signup') }}>
              {isSignup ? '로그인' : '회원가입'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 회원가입 역할 선택 카드입니다.
 * - kind: 이 카드가 나타내는 역할(student/teacher)
 * - role: 현재 선택된 역할
 * - setRole: 클릭 시 부모 LoginPage의 role state를 변경합니다.
 */
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

/**
 * 좌측 비주얼 패널 하단의 작은 기능 칩입니다.
 * bg는 CSS 변수 문자열을 그대로 style에 넣어 배경색을 지정합니다.
 */
function MiniFeature({ icon, bg, text }) {
  return (
    <div className="mini-feat">
      <div className="ico" style={{ background: bg }}>{icon}</div>
      {text}
    </div>
  )
}

/**
 * 로그인 화면 왼쪽에 들어가는 학생 일러스트 SVG입니다.
 * 디자인만 담당하므로 상태/이벤트는 없습니다.
 */
function StudentSVG() {
  return (
    <svg className="visual-svg" viewBox="0 0 360 280" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="240" x2="340" y2="240" stroke="#1F2937" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
      <g transform="translate(135, 70)">
        <path d="M 30 80 L 10 180 L 80 180 L 60 80 Z" fill="#0EA5A4" stroke="#1F2937" strokeWidth="2.5" />
        <g style={{ transformOrigin: '65px 80px', animation: 'wave 1.6s ease-in-out infinite' }}>
          <path d="M 55 80 Q 80 50 90 20" stroke="#FDE7E0" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 55 80 Q 80 50 90 20" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="92" cy="18" r="9" fill="#FDE7E0" stroke="#1F2937" strokeWidth="2" />
        </g>
        <path d="M 25 80 Q 18 120 24 150" stroke="#FDE7E0" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 25 80 Q 18 120 24 150" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="45" cy="50" r="32" fill="#FDE7E0" stroke="#1F2937" strokeWidth="2.5" />
        <path d="M 14 46 Q 14 18 45 18 Q 76 18 76 46 Q 70 36 60 32 Q 50 30 40 32 Q 26 34 18 42 Q 14 42 14 46 Z" fill="#1F2937" />
        <circle cx="35" cy="50" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="55" cy="50" r="4" fill="white" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="35" cy="50" r="2" fill="#1F2937" />
        <circle cx="55" cy="50" r="2" fill="#1F2937" />
        <path d="M 38 62 Q 45 70 52 62" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="27" cy="60" r="3" fill="#FB7185" opacity="0.6" />
        <circle cx="63" cy="60" r="3" fill="#FB7185" opacity="0.6" />
      </g>
      <g transform="translate(225, 80)">
        <rect x="0" y="0" width="100" height="44" rx="14" fill="#FFFDF9" stroke="#1F2937" strokeWidth="2.5" />
        <path d="M 12 44 L 8 56 L 24 44 Z" fill="#FFFDF9" stroke="#1F2937" strokeWidth="2.5" />
        <text x="50" y="20" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="20" fontWeight="700" fill="#0F766E">안녕!</text>
        <text x="50" y="36" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fill="#1F2937">함께 공부해요</text>
      </g>
      <style>{`@keyframes wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(15deg); } }`}</style>
    </svg>
  )
}
