/**
 * @file ChargePage.jsx
 * @description 마일리지 충전 페이지. 금액을 고르면 토스 결제창을 연다.
 * - 충전 1원 = 1마일리지. AI 질문/강의 개설/수강신청에 마일리지가 쓰인다.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMyMileage, requestWithdrawal } from '../../api/paymentApi.js'
import { startTossPayment } from '../../payment/tossPayment.js'

const AMOUNTS = [5000, 10000, 30000, 50000]

export default function ChargePage() {
  const [activeTab, setActiveTab] = useState('charge') // 'charge' or 'withdraw'
  const [balance, setBalance] = useState(null)
  const [costs, setCosts] = useState(null)
  
  // 충전 상태
  const [amount, setAmount] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 환급 상태
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' })
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyMileage()
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
      setError(e?.message || '결제를 시작하지 못했습니다.')
      setLoading(false)
    }
  }

  async function handleWithdraw() {
    setWithdrawMsg({ type: '', text: '' })
    const wAmount = Number(withdrawAmount)
    if (!wAmount || wAmount <= 0) {
      return setWithdrawMsg({ type: 'error', text: '환급할 금액을 올바르게 입력해주세요.' })
    }
    if (balance === null || wAmount > balance) {
      return setWithdrawMsg({ type: 'error', text: '보유한 마일리지를 초과할 수 없습니다.' })
    }
    if (!bankName || !accountNumber || !accountHolder) {
      return setWithdrawMsg({ type: 'error', text: '환급받을 계좌 정보를 모두 입력해주세요.' })
    }

    setLoading(true)
    try {
      await requestWithdrawal({ amount: wAmount, bankName, accountNumber, accountHolder })
      setWithdrawMsg({ type: 'success', text: '환급 요청이 완료되었습니다. 영업일 기준 1~3일 내 입금됩니다.' })
      setBalance(b => b - wAmount)
      window.dispatchEvent(new Event('mileageChanged'))
      setWithdrawAmount('')
      setBankName('')
      setAccountNumber('')
      setAccountHolder('')
    } catch (e) {
      setWithdrawMsg({ type: 'error', text: e?.message || '환급 요청에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page pay-page">
      <h1 className="pay-title">마일리지 관리</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button type="button" onClick={() => { setActiveTab('charge'); setError('') }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: activeTab === 'charge' ? '#3b82f6' : '#fff', color: activeTab === 'charge' ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>마일리지 충전</button>
        <button type="button" onClick={() => { setActiveTab('withdraw'); setWithdrawMsg({ type: '', text: '' }) }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: activeTab === 'withdraw' ? '#10b981' : '#fff', color: activeTab === 'withdraw' ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>마일리지 환급</button>
      </div>

      <p className="pay-sub">
        현재 잔액: <strong style={{ color: '#0f172a' }}>{balance == null ? '…' : `${balance.toLocaleString()} 마일리지`}</strong>
        {costs && <span style={{ marginLeft: 12, fontSize: 13 }}>
          (AI 질문 {costs.aiQuestion} · 강의 개설 {costs.courseOpen})
        </span>}
      </p>

      {activeTab === 'charge' ? (
        <>
          <div className="pay-amount-grid">
            {AMOUNTS.map(a => (
              <button key={a} type="button" onClick={() => setAmount(a)}
                className={`pay-amount-btn ${amount === a ? 'is-active' : ''}`}>
                {a.toLocaleString()}원
              </button>
            ))}
          </div>
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            충전 금액 <strong>{amount.toLocaleString()}원</strong> → <strong>{amount.toLocaleString()} 마일리지</strong>
          </p>
          {error && <p className="pay-error">{error}</p>}
          <button type="button" className="pay-cta" onClick={handleCharge} disabled={loading}>
            {loading ? '결제창 여는 중…' : `${amount.toLocaleString()}원 결제하기`}
          </button>
          <p className="pay-note">※ 테스트 결제입니다. 실제 금액이 청구되지 않으며, 토스 테스트 카드로 진행됩니다.</p>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>환급 요청 마일리지</label>
            <input type="number" placeholder="환급할 금액을 입력하세요" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>환급받을 은행</label>
            <input type="text" placeholder="예: 신한은행" value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>계좌번호</label>
            <input type="text" placeholder="예: 110-123-456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>예금주</label>
            <input type="text" placeholder="예: 홍길동" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          {withdrawMsg.text && (
            <p style={{ margin: 0, padding: '12px', borderRadius: '8px', backgroundColor: withdrawMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: withdrawMsg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '0.9rem', fontWeight: 600 }}>
              {withdrawMsg.text}
            </p>
          )}

          <button type="button" onClick={handleWithdraw} disabled={loading} style={{ marginTop: '8px', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '요청 중...' : '환급 요청하기'}
          </button>
        </div>
      )}
    </main>
  )
}
