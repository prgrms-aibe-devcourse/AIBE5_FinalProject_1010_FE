/**
 * @file Badge.jsx
 * @description 과목, 학년, LIVE, BEST 같은 작은 라벨 칩 컴포넌트입니다.
 * - variant 값에 따라 배경색이 달라집니다.
 * - variant가 없으면 기본 badge 스타일만 적용됩니다.
 */
/**
 * 작은 태그 칩. variant: mint | peach | butter | sky | lavender | live
 */
export default function Badge({ variant = '', children }) {
  const cls = variant ? `badge ${variant}` : 'badge'
  return <span className={cls}>{children}</span>
}
