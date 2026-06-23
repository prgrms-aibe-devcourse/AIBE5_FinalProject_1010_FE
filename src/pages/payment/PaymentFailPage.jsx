/**
 * @file PaymentFailPage.jsx
 * @description 토스 결제 실패/취소 리다이렉트(/#/payment/fail?code&message&orderId).
 */
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentFailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.'

  return (
    <main className="page" style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <h1 style={{ fontWeight: 800, marginBottom: 12 }}>결제 실패</h1>
      <p style={{ color: '#475569', marginBottom: 28 }}>{message}</p>
      <button onClick={() => navigate('/payment/charge', { replace: true })}
        style={{ padding: '13px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#64748b', color: '#fff', fontWeight: 700 }}>
        다시 시도
      </button>
    </main>
  )
}
