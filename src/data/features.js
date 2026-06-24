/**
 * @file features.js
 * @description 메인 페이지 WHY STUDY FLOW 기능 카드 데이터입니다.
 * - StudyFlow의 차별점인 화이트보드, AI 해설, 화상 수업, LMS 등을 설명합니다.
 * - bg 값은 FeaturesSection의 카드 배경색 클래스와 연결됩니다.
 */
/**
 * 주요 기능 (Features 섹션 - tilt cards)
 */
// 기능 카드 필드
// icon/title/desc: 카드에 표시되는 내용, bg: 카드 배경 클래스
export const features = [
  {
    icon: '✏️', title: '실시간 공유 화이트보드',
    desc: '선생님 판서와 학생 풀이를 한 화면에서! 연필·도형·지우개·확대축소·이미지 업로드까지 다 돼요.',
    bg: 'bg-mint'
  },
  {
    icon: '🤖', title: 'AI 문제 해설',
    desc: '모르는 문제는 사진 한 장으로 충분! AI가 단계별 풀이와 핵심 개념을 즉시 알려줍니다.',
    bg: 'bg-peach'
  },
  {
    icon: '🎥', title: '고품질 화상 수업',
    desc: '저지연 그룹 화상통화와 화면공유, 그리기 권한 부여까지 완벽 지원해요.',
    bg: 'bg-butter'
  },
  {
    icon: '📊', title: '통합 LMS',
    desc: '수업·공지·출석·시험·게시판을 한 사이트에서 — 흩어진 도구는 이제 그만!',
    bg: 'bg-sky'
  },
  {
    icon: '💬', title: '내공 점수 시스템',
    desc: '답변 채택 시 선생님 내공 상승! 검증된 선생님이 검색 상단에 노출돼요.',
    bg: 'bg-lavender'
  },
  {
    icon: '🎯', title: '맞춤 매칭',
    desc: '필터링으로 나에게 딱 맞는 선생님과 강의를 빠르게 찾아드려요.',
    bg: 'bg-mint'
  },
]
