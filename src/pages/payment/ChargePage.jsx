/**
 * @file ChargePage.jsx
 * @description 크레딧 충전 페이지. 금액을 고르면 토스 결제창을 연다.
 * - 충전 1원 = 1크레딧. AI 질문/강의 개설에 크레딧이 쓰인다.
 */
import { useEffect, useState } from 'react'
import { fetchMyCredit } from '../../api/paymentApi.js'
import { startTossPayment } from '../../payment/tossPayment.js'

const AMOUNTS = [5000, 10000, 30000, 50000]

export default function ChargePage() {
  const [balance, setBalance] = useState(null)
  const [costs, setCosts] = useState(null)
  const [amount, setAmount] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyCredit()
      .then(d => { setBalance(d.balance); setCosts(d.costs) })
      .catch(() => {})
  }, [])

  async function handleCharge() {
    setError('')
    setLoading(true)
    try {
      await startTossPayment({ type: 'CREDIT_CHARGE', amount })
      // 성공 시 토스가 /#/payment/success 로 리다이렉트하므로 이후 코드는 보통 실행되지 않음.
    } catch (e) {
      // 사용자가 결제창을 닫거나 SDK 오류
      setError(e?.message || '결제를 시작하지 못했습니다.')
      setLoading(false)
    }
  }

  return (
    <main className="page" style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontWeight: 800, marginBottom: 8 }}>크레딧 충전</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        현재 잔액: <strong style={{ color: '#0f172a' }}>{balance == null ? '…' : `${balance.toLocaleString()} 크레딧`}</strong>
        {costs && <span style={{ marginLeft: 12, fontSize: 13 }}>
          (AI 질문 {costs.aiQuestion} · 강의 개설 {costs.courseOpen})
        </span>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {AMOUNTS.map(a => (
          <button key={a} type="button" onClick={() => setAmount(a)}
            style={{
              padding: '16px 0', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer',
              border: amount === a ? '2px solid #14b8a6' : '1px solid #cbd5e1',
              background: amount === a ? '#f0fdfa' : '#fff', color: '#0f172a',
            }}>
            {a.toLocaleString()}원
          </button>
        ))}
      </div>

      <p style={{ marginBottom: 16, fontSize: 14 }}>
        충전 금액 <strong>{amount.toLocaleString()}원</strong> → <strong>{amount.toLocaleString()} 크레딧</strong>
      </p>

      {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}

      <button type="button" onClick={handleCharge} disabled={loading}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#14b8a6', color: '#fff', fontWeight: 800, fontSize: 16, opacity: loading ? 0.6 : 1,
        }}>
        {loading ? '결제창 여는 중…' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
        ※ 테스트 결제입니다. 실제 금액이 청구되지 않으며, 토스 테스트 카드로 진행됩니다.
      </p>
    </main>
  )
}
