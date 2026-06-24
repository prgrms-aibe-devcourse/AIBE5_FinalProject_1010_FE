import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSubscriptionSummary, purchaseSubscription, refundSubscription } from '../../api/subscriptionApi.js'

const PRODUCT_COPY = {
  AI_QUESTION: {
    title: 'AI 질문 구독권',
    desc: '30일 동안 AI 질문을 마일리지 차감 없이 사용할 수 있어요.',
    badge: 'AI 질문',
  },
  LIVE_CLASS: {
    title: 'Live 강의 구독권',
    desc: '30일 동안 실시간 수업 기능 이용권을 보유합니다.',
    badge: 'Live 강의',
  },
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SubscriptionPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyingType, setBuyingType] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeByType = useMemo(() => {
    const map = new Map()
    for (const sub of summary?.subscriptions ?? []) {
      if (sub.status === 'ACTIVE' && !map.has(sub.type)) map.set(sub.type, sub)
    }
    return map
  }, [summary])

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    setLoading(true)
    try {
      setSummary(await fetchSubscriptionSummary())
    } catch (e) {
      setError(e?.message || '구독권 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(type) {
    setError('')
    setMessage('')
    setBuyingType(type)
    try {
      const purchased = await purchaseSubscription(type)
      const nextSummary = await fetchSubscriptionSummary()
      setSummary(nextSummary)
      window.dispatchEvent(new Event('mileageChanged'))
      setMessage(`${purchased.name} 구매가 완료되었습니다. 만료일: ${formatDateTime(purchased.expiresAt)}`)
    } catch (e) {
      const isMileageShort = e?.code === 'INSUFFICIENT_CREDIT' || e?.status === 402
      setError(isMileageShort
        ? '마일리지가 부족해서 구독권을 구매할 수 없습니다. 마일리지를 충전한 뒤 다시 시도해 주세요.'
        : (e?.message || '구독권 구매에 실패했습니다.'))
    } finally {
      setBuyingType(null)
    }
  }

  async function handleRefund(subscriptionId) {
    if (!window.confirm('정말로 이 구독권을 환불하시겠습니까? 마일리지가 즉시 복구됩니다.')) return
    setError('')
    setMessage('')
    try {
      await refundSubscription(subscriptionId)
      setMessage('구독권이 환불되었습니다.')
      const nextSummary = await fetchSubscriptionSummary()
      setSummary(nextSummary)
      window.dispatchEvent(new Event('mileageChanged'))
    } catch (e) {
      setError(e?.message || '환불 처리에 실패했습니다.')
    }
  }

  return (
    <main className="page pay-page pay-page--wide">
      <div className="pay-head-row">
        <div>
          <h1 className="pay-title">구독권 구매</h1>
          <p className="pay-sub">
            보유 마일리지로 30일 구독권을 구매합니다. 현재 잔액:{' '}
            <strong style={{ color: '#0f172a' }}>{summary ? `${summary.mileageBalance.toLocaleString()} 마일리지` : '…'}</strong>
          </p>
        </div>
        <Link to="/payment/charge" className="pay-link-btn">마일리지 충전</Link>
      </div>

      {loading && <p className="pay-note">구독권 정보를 불러오는 중...</p>}
      {message && <p className="pay-success">{message}</p>}
      {error && <p className="pay-error">{error}</p>}

      <section className="sub-product-grid">
        {(summary?.products ?? []).map(product => {
          const copy = PRODUCT_COPY[product.type] ?? { title: product.name, desc: '', badge: product.type }
          const active = activeByType.get(product.type)
          const disabled = buyingType != null
          return (
            <article className="sub-product-card" key={product.type}>
              <span className="sub-product-badge">{copy.badge}</span>
              <h2>{copy.title}</h2>
              <p>{copy.desc}</p>
              <div className="sub-product-price">
                {product.priceMileage.toLocaleString()} <span>마일리지</span>
              </div>
              <div className="sub-product-term">구매일 기준 {product.durationDays}일</div>
              {active && <div className="sub-active-box">사용 중 · {formatDateTime(active.expiresAt)} 만료</div>}
              <button
                type="button"
                className="pay-cta sub-buy-btn"
                onClick={() => setConfirmModal(product.type)}
                disabled={disabled}
              >
                {buyingType === product.type ? '구매 중...' : active ? '30일 연장 구매' : '구매하기'}
              </button>
            </article>
          )
        })}
      </section>

      <section className="sub-history">
        <h2>내 구독권</h2>
        {summary?.subscriptions?.length ? (
          <div className="sub-history-list">
            {summary.subscriptions.map(sub => (
              <div className="sub-history-item" key={sub.id}>
                <div>
                  <strong>{sub.name}</strong>
                  <span style={{ marginLeft: '8px', fontWeight: 600, color: sub.status === 'SCHEDULED' ? '#3b82f6' : sub.status === 'ACTIVE' ? '#22c55e' : '#94a3b8' }}>
                    {sub.status === 'ACTIVE' ? '사용 중' :
                     sub.status === 'SCHEDULED' ? '사용 예정' :
                     sub.status === 'REFUNDED' ? '환불됨' : '만료됨'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <p style={{ margin: 0 }}>{formatDateTime(sub.startsAt)} 시작 · {formatDateTime(sub.expiresAt)} 만료</p>
                  {sub.status === 'SCHEDULED' && (
                    <button 
                      onClick={() => handleRefund(sub.id)}
                      style={{
                        padding: '4px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #ef4444',
                        backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 500
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    >환불하기</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="pay-note">구매한 구독권이 없습니다.</p>
        )}
      </section>

      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '32px',
            width: '380px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            textAlign: 'center', boxSizing: 'border-box'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>구독권 구매 확인</h2>
            <p style={{ margin: '16px 0 28px', color: '#475569', lineHeight: '1.5' }}>
              정말로 <strong>{PRODUCT_COPY[confirmModal]?.title}</strong>을(를)<br/>구매하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: '8px', border: '1px solid #cbd5e1',
                  backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600,
                  fontSize: '1rem', transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
              >
                취소
              </button>
              <button 
                onClick={() => {
                  const type = confirmModal;
                  setConfirmModal(null);
                  handlePurchase(type);
                }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: '8px', border: 'none',
                  backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600,
                  fontSize: '1rem', transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
