import { useEffect, useRef } from 'react'

export default function TermsModal({ onClose }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  const dialogRef = useRef(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, width: '100%', maxWidth: 640,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          outline: 'none',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 id="terms-modal-title" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>이용약관 및 개인정보처리방침</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', lineHeight: 1, padding: '0 4px' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ overflowY: 'auto', padding: '24px', lineHeight: 1.8, fontSize: 14, color: '#1e293b' }}>
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              1. 개인정보 수집 및 이용 목적
            </h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>회원 가입 및 본인 식별 (이메일, 비밀번호, 이름, 성별, 생년월일, 역할)</li>
              <li style={{ marginBottom: 6 }}>소셜 로그인 최초 가입 시 추가 정보 수집 (성별, 생년월일, 휴대폰 번호(선택), 역할)</li>
              <li>마이페이지 내 사용자의 '로그인 기록 조회' 기능 제공 (접속 IP, 기기 정보)</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              2. 수집하는 개인정보 항목
            </h3>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>사용자 입력 항목: 회원 ID, 비밀번호</p>
            <p style={{ marginBottom: 12, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
              ⚠️ 비밀번호는 암호화 알고리즘(BCrypt)을 통해 안전하게 암호화되어 저장되므로 관리자도 열람할 수 없습니다.
            </p>
            <p style={{ margin: 0 }}>시스템 자동 수집 항목: 접속 일시, 접속 IP 주소, 기기 정보 (OS 및 브라우저 종류)</p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              3. 개인정보의 보유 및 이용 기간
            </h3>
            <p style={{ marginBottom: 8 }}>
              수집된 모든 데이터는 본 토이 프로젝트의 테스트 및 평가가 완료되는 즉시 지체 없이 파기(데이터베이스 삭제)합니다.
            </p>
            <p style={{ margin: 0, fontWeight: 600 }}>파기 예정 시점: 2026년 7월 2일 (AIBE5 종료 시점)</p>
          </section>

          <section>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              4. 이용자 유의사항
            </h3>
            <p style={{ margin: 0, padding: '12px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6 }}>
              본 사이트는 보안 테스트용 환경이므로, 타 사이트에서 사용하는 실제 비밀번호나 중요한 개인정보는 입력하지 마십시오. 가급적 테스트용 더미 계정 생성을 권장합니다.
            </p>
          </section>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 28px', fontSize: 14, cursor: 'pointer', border: 'none', borderRadius: 8, background: '#3b82f6', color: '#fff', fontWeight: 600 }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
