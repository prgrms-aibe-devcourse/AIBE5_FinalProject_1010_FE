/**
 * @file PaymentFailPage.jsx
 * @description 토스 결제 실패/취소 리다이렉트(/#/payment/fail?code&message&orderId).
 */
import { useNavigate, useSearchParams } from 'react-router-dom'
import PaymentResultView from './components/PaymentResultView.jsx'

export default function PaymentFailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.'

  return (
    <PaymentResultView status="fail" message={message}>
      <button className="pay-result__btn pay-result__btn--muted"
        onClick={() => navigate('/payment/charge', { replace: true })}>다시 시도</button>
    </PaymentResultView>
  )
}
