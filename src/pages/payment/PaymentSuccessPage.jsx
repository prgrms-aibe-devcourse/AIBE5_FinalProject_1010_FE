/**
 * @file PaymentSuccessPage.jsx
 * @description 토스 결제(크레딧 충전) 성공 리다이렉트(/#/payment/success?paymentKey&orderId&amount).
 * 받은 값을 서버 승인(confirm)으로 보내 검증·확정한다. 성공하면 충전 후 잔액을 안내한다.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment } from '../../api/paymentApi.js'
import PaymentResultView from './components/PaymentResultView.jsx'

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
        const balance = res.creditBalance?.toLocaleString?.() ?? res.creditBalance
        setState({ status: 'ok', message: `충전 완료! 현재 잔액 ${balance} 크레딧` })
      })
      .catch(e => setState({ status: 'fail', message: e?.message || '결제 승인에 실패했습니다.' }))
  }, [params])

  return (
    <PaymentResultView status={state.status} message={state.message}>
      {state.status === 'ok' && (
        <button className="pay-result__btn pay-result__btn--primary"
          onClick={() => navigate('/', { replace: true })}>홈으로</button>
      )}
      {state.status === 'fail' && (
        <button className="pay-result__btn pay-result__btn--muted"
          onClick={() => navigate('/payment/charge', { replace: true })}>다시 시도</button>
      )}
    </PaymentResultView>
  )
}
