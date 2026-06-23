/**
 * @file PaymentSuccessPage.jsx
 * @description 토스 결제 성공 리다이렉트(/#/payment/success?paymentKey&orderId&amount).
 * 받은 값을 서버 승인(confirm)으로 보내 검증·확정한다. 성공하면 결과(크레딧/수강) 안내.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment } from '../../api/paymentApi.js'

export default function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'confirming', message: '결제를 확인하는 중…' })
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = Number(params.get('amount'))
    if (!paymentKey || !orderId || !amount) {
      setState({ status: 'fail', message: '잘못된 접근입니다.' })
      return
    }
    confirmPayment({ paymentKey, orderId, amount })
      .then(res => {
        if (res.enrolledCourseId) {
          setState({ status: 'ok', message: '결제가 완료되어 수강 등록되었습니다.', courseId: res.enrolledCourseId })
        } else {
          setState({ status: 'ok', message: `충전 완료! 현재 잔액 ${res.creditBalance?.toLocaleString?.() ?? res.creditBalance} 크레딧` })
        }
      })
      .catch(e => setState({ status: 'fail', message: e?.message || '결제 승인에 실패했습니다.' }))
  }, [params])

  return (
    <main className="page" style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>
        {state.status === 'ok' ? '✅' : state.status === 'fail' ? '❌' : '⏳'}
      </div>
      <h1 style={{ fontWeight: 800, marginBottom: 12 }}>
        {state.status === 'ok' ? '결제 완료' : state.status === 'fail' ? '결제 실패' : '확인 중'}
      </h1>
      <p style={{ color: '#475569', marginBottom: 28 }}>{state.message}</p>

      {state.status === 'ok' && state.courseId && (
        <button onClick={() => navigate(`/courses/${state.courseId}`, { replace: true })}
          style={btn('#14b8a6')}>수업으로 가기</button>
      )}
      {state.status === 'ok' && !state.courseId && (
        <button onClick={() => navigate('/', { replace: true })} style={btn('#14b8a6')}>홈으로</button>
      )}
      {state.status === 'fail' && (
        <button onClick={() => navigate('/payment/charge', { replace: true })} style={btn('#64748b')}>다시 시도</button>
      )}
    </main>
  )
}

function btn(bg) {
  return { padding: '13px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: bg, color: '#fff', fontWeight: 700, fontSize: 15 }
}
