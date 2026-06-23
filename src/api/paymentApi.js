/**
 * @file paymentApi.js
 * @description 결제(토스)·구독(이용권) 관련 백엔드 API 래퍼.
 * - 결제 승인은 반드시 백엔드를 거친다(프론트 단독 승인 금지).
 */
import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

const BASE = `${API_BASE}/api/v1`

async function toJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    error.code = data?.code
    error.data = data
    throw error
  }
  return data
}

/** 토스 결제창 초기화용 클라이언트 키. */
export async function fetchClientKey() {
  return toJson(await authFetch(`${BASE}/payments/client-key`))
}

/**
 * 결제 주문 생성(결제창 열기 전). 금액·용도는 서버가 확정한다.
 * @param {{type:'SUBSCRIPTION'|'ENROLLMENT', refId?:number, subscriptionType?:'AI_QUESTION'|'COURSE_OPEN'}} payload
 * @returns {Promise<{orderId:string, orderName:string, amount:number}>}
 */
export async function createPaymentOrder(payload) {
  return toJson(await authFetch(`${BASE}/payments/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
}

/** 결제 승인(토스 성공 콜백 값 전달 → 서버가 검증·확정). */
export async function confirmPayment({ paymentKey, orderId, amount }) {
  return toJson(await authFetch(`${BASE}/payments/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  }))
}

/**
 * 내 구독(이용권) 상태 + 구매 가능한 플랜 목록.
 * @returns {Promise<{
 *   subscriptions: Array<{type:string, expiresAt:string, active:boolean}>,
 *   plans: Array<{type:string, name:string, price:number, durationDays:number}>
 * }>}
 */
export async function fetchMySubscriptions() {
  return toJson(await authFetch(`${BASE}/subscriptions/me`))
}
