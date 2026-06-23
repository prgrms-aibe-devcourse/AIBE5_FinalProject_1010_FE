/**
 * @file SubscriptionPage.jsx
 * @description 이용권(구독) 구매 페이지.
 * - AI 질문 이용권(5,000원/월), 강의 개설 이용권(10,000원/월)을 한 번 결제하면 30일 사용.
 * - 자동 갱신 없음. 만료 후 다시 결제하면 남은 기간에 30일이 더해진다(연장).
 */
import { useEffect, useState } from 'react'
import { fetchMySubscriptions } from '../../api/paymentApi.js'
import { startTossPayment } from '../../payment/tossPayment.js'

// 플랜 표시 메타(아이콘/설명). 가격·이름은 서버 plans 응답을 신뢰한다.
const PLAN_META = {
  AI_QUESTION: { icon: '🤖', desc: 'AI에게 무제한으로 질문하고 풀이를 받아보세요.' },
  COURSE_OPEN: { icon: '📚', desc: '선생님으로서 강의를 개설하고 학생을 모집하세요.' },
}

function formatExpiry(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([])
  const [subs, setSubs] = useState([])
  const [loadingType, setLoadingType] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMySubscriptions()
      .then(d => { setPlans(d.plans || []); setSubs(d.subscriptions || []) })
      .catch(() => {})
  }, [])

  async function handleSubscribe(type) {
    setError('')
    setLoadingType(type)
    try {
      await startTossPayment({ type: 'SUBSCRIPTION', subscriptionType: type })
      // 성공 시 토스가 /#/payment/success 로 리다이렉트하므로 이후 코드는 보통 실행되지 않음.
    } catch (e) {
      setError(e?.message || '결제를 시작하지 못했습니다.')
      setLoadingType(null)
    }
  }

  return (
    <main className="page" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontWeight: 800, marginBottom: 8 }}>이용권 구매</h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>
        한 번 결제하면 <strong>30일</strong> 동안 이용할 수 있어요. 자동 갱신은 없습니다.
      </p>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {plans.map(plan => {
          const meta = PLAN_META[plan.type] || {}
          const mine = subs.find(s => s.type === plan.type)
          const active = mine?.active
          const expiry = active ? formatExpiry(mine.expiresAt) : null
          const busy = loadingType === plan.type
          return (
            <div key={plan.type} style={{
              border: active ? '2px solid #14b8a6' : '1px solid #e2e8f0', borderRadius: 16,
              padding: 24, background: active ? '#f0fdfa' : '#fff', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{meta.icon}</div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{plan.name}</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16, minHeight: 40 }}>{meta.desc}</p>
              <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
                {plan.price.toLocaleString()}원
                <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}> / {plan.durationDays}일</span>
              </div>
              {active && (
                <p style={{ fontSize: 13, color: '#0f766e', marginBottom: 12 }}>
                  ✅ 이용 중 · {expiry}까지
                </p>
              )}
              <button type="button" onClick={() => handleSubscribe(plan.type)} disabled={busy}
                style={{
                  marginTop: 'auto', width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  cursor: busy ? 'default' : 'pointer', background: '#14b8a6', color: '#fff',
                  fontWeight: 800, fontSize: 15, opacity: busy ? 0.6 : 1,
                }}>
                {busy ? '결제창 여는 중…' : active ? '연장하기' : `${plan.price.toLocaleString()}원 결제`}
              </button>
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
        ※ 테스트 결제입니다. 실제 금액이 청구되지 않으며, 토스 테스트 카드로 진행됩니다.
      </p>
    </main>
  )
}
