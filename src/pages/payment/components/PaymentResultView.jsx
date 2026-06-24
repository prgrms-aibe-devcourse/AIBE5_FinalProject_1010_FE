/**
 * @file PaymentResultView.jsx
 * @description 결제 결과(확인중/성공/실패) 공통 화면.
 * 아이콘·제목·메시지·액션 버튼 영역만 받아 같은 레이아웃으로 렌더한다.
 * 성공 페이지와 실패 페이지가 이 컴포넌트를 공유한다.
 */

const PRESET = {
  confirming: { icon: '⏳', title: '확인 중' },
  ok:         { icon: '✅', title: '결제 완료' },
  fail:       { icon: '❌', title: '결제 실패' },
}

export default function PaymentResultView({ status = 'confirming', title, message, children }) {
  const preset = PRESET[status] ?? PRESET.confirming
  return (
    <main className="page pay-result">
      <div className="pay-result__icon">{preset.icon}</div>
      <h1 className="pay-result__title">{title ?? preset.title}</h1>
      <p className="pay-result__msg">{message}</p>
      {children}
    </main>
  )
}
