/**
 * @file tossPayment.js
 * @description 토스페이먼츠 결제창 호출 유틸.
 *
 * 흐름: 서버에서 주문 생성 → 이 함수로 결제창 열기 → 토스가 successUrl로 리다이렉트
 *  → PaymentSuccessPage가 paymentKey·orderId·amount로 서버 승인 호출.
 *
 * successUrl/failUrl은 HashRouter 경로(/#/...)로 둔다. 토스가 쿼리(paymentKey 등)를
 * 뒤에 붙이면 해시 프래그먼트 안의 쿼리가 되어 useSearchParams로 읽을 수 있다.
 */
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { fetchClientKey, createPaymentOrder } from '../api/paymentApi.js'

/**
 * 주문 생성 + 토스 결제창 호출.
 * @param {{type:'CREDIT_CHARGE'|'ENROLLMENT', amount?:number, refId?:number}} orderReq
 */
export async function startTossPayment(orderReq) {
  // 1) 서버에 주문 생성(금액·용도 확정)
  const order = await createPaymentOrder(orderReq)
  // 2) 클라이언트 키로 SDK 로드
  const { clientKey } = await fetchClientKey()
  const tossPayments = await loadTossPayments(clientKey)
  const payment = tossPayments.payment({ customerKey: ANONYMOUS })
  // 3) 결제창 호출 (성공/실패 시 아래 URL로 리다이렉트)
  const origin = window.location.origin
  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: order.amount },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl: `${origin}/#/payment/success`,
    failUrl: `${origin}/#/payment/fail`,
  })
}
