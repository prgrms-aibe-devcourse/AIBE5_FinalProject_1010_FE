const STEPS = ['채팅 협의', '신청하기', '선생님 수락', '수업 확정', '결제']

export default function CoursePriceBlock() {
  return (
    <div className="cd-block">
      <h2 className="cd-block__title">결제 안내</h2>
      <div className="cd-flow">
        {STEPS.reduce((acc, step, i) => {
          acc.push(<span key={step} className="cd-flow__step"><b>{i + 1}</b> {step}</span>)
          if (i < STEPS.length - 1) acc.push(<span key={`a${i}`} className="cd-flow__arr">→</span>)
          return acc
        }, [])}
      </div>
      <p className="cd-price-tip">채팅 협의 시 선생님과의 채팅창으로 신청 링크가 미리 발송됩니다.</p>
    </div>
  )
}
