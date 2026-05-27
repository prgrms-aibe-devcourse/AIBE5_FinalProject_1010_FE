/**
 * @file categories.js
 * @description 메인 페이지의 분야별 인기 수업 카테고리 더미 데이터입니다.
 * - 백엔드 연동 전까지 화면 UI를 채우는 목업 데이터입니다.
 * - name은 카드 제목, count는 강의 수, bg는 아이콘 배경색 CSS 변수입니다.
 */
/**
 * 분야별 카테고리 데이터 (메인 페이지 Categories 섹션)
 */
// 카테고리 카드 필드
// icon: 카드 상단 이모지, name: 카테고리명, count: 강의 수, bg: 아이콘 배경색
export const categories = [
  { icon: '🧮', name: '수학',   count: '2,184', bg: 'var(--peach-bg)' },
  { icon: '🔬', name: '과학',   count: '1,402', bg: 'var(--sky-bg)' },
  { icon: '📖', name: '국어',   count: '986',   bg: 'var(--butter-bg)' },
  { icon: '🌍', name: '영어',   count: '3,021', bg: 'var(--mint-bg)' },
  { icon: '💻', name: '코딩',   count: '512',   bg: 'var(--lavender-bg)' },
  { icon: '🎨', name: '예체능', count: '238',   bg: 'var(--peach-bg)' },
]
