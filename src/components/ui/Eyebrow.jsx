/**
 * @file Eyebrow.jsx
 * @description 섹션 제목 위에 붙는 작은 강조 라벨입니다.
 * - 예: LIVE NOW, WHY STUDY FLOW, 검색 & 추천 등.
 * - variant 값은 common.css의 .eyebrow 계열 스타일과 연결됩니다.
 */
/**
 * 섹션 위 작은 라벨 (eyebrow pill).
 * variant: teal | coral | yellow | sky
 */
export default function Eyebrow({ variant = '', children }) {
  const cls = variant ? `eyebrow ${variant}` : 'eyebrow'
  return <span className={cls}>{children}</span>
}
