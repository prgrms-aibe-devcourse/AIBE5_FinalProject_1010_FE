/**
 * @file courseDetail.js
 * @description 수업 상세 페이지(CourseDetailPage.jsx)에서 사용하는 더미 데이터입니다.
 */

export const courseDetail = {
  id: 1,
  title: '[수능대비] 미적분 II 킬러문항 완전정복 8주',
  subjectName: '수학',
  gradeLabel: '고3',
  mode: '비대면 화상',
  status: 'RECRUITING',
  thumbnailBg: 'bg1',
  subject: '미적분 II',
  hand: '킬러문항 ⚡',
  rating: 4.9,
  reviewCount: 284,
  pricePerSession: 24500,
  totalSessions: 24,
  durationMinutes: 90,
  maxStudents: 6,
  currentStudents: 4,
  schedule: '매주 월·수·금  오후 7:00',
  startDate: '2026년 6월 14일',
  tags: ['미적분', '수능', '킬러문항', '고3', '화상수업'],
  intro:
    '수능 수학 킬러문항 전문 강사 박지훈 선생님의 8주 완성 미적분 마스터 클래스입니다. ' +
    '개념의 원리를 시각적으로 이해하고, 실전 킬러문항을 반복 훈련해 1등급을 목표합니다.',
  highlights: [
    '수능 기출 킬러문항 집중 분석 및 유형별 풀이법 완성',
    '공유 화이트보드를 활용한 학생 주도 실시간 첨삭 지도',
    '매 수업 후 개인 맞춤 피드백 리포트 제공',
    '수업 녹화본 7일 무제한 재시청 가능',
    '문제집 인쇄본 · PDF 별도 제공',
  ],
  curriculum: [
    { week: 1, title: '수열의 극한과 함수의 극한', topics: '수열의 수렴·발산, 함수의 좌·우극한, 연속함수의 성질' },
    { week: 2, title: '미분의 기초', topics: '평균변화율과 순간변화율, 미분의 정의, 미분가능과 연속' },
    { week: 3, title: '다항함수의 미분법', topics: '미분 계산 규칙, 합성함수·역함수 미분, 고차함수 미분' },
    { week: 4, title: '삼각·지수·로그 함수 미분', topics: 'sin·cos·tan 미분, e^x·ln x 미분, 치환법' },
    { week: 5, title: '적분의 기초 · 부정적분', topics: '역도함수 개념, 적분 상수, 치환 적분' },
    { week: 6, title: '정적분과 넓이', topics: '정적분 계산, 곡선과 직선 사이 넓이, 회전체의 부피' },
    { week: 7, title: '킬러문항 풀이 전략 I', topics: '최근 5개년 수능·모의고사 킬러 유형 집중 분석' },
    { week: 8, title: '킬러문항 풀이 전략 II + 모의 수능', topics: '실전 모의고사 1회 시행 · 전체 오답 총정리' },
  ],
  reviews: [
    {
      id: 1, initial: '이', avatarClass: 'a-blue',
      name: '이*현', courseName: '미적분 II 8주', date: '2026.05', rating: 5,
      content: '킬러문항이 무서웠는데 이제 보이는 게 달라요. 실시간으로 바로 질문하고 답을 받는 게 너무 좋습니다.',
    },
    {
      id: 2, initial: '박', avatarClass: 'a-yellow',
      name: '박*준', courseName: '미적분 II 8주', date: '2026.04', rating: 5,
      content: '개념부터 킬러까지 촘촘하게 다 다뤄서 시험장에서 자신감이 달라졌어요. 적극 추천합니다!',
    },
    {
      id: 3, initial: '김', avatarClass: 'a-pink',
      name: '김*서', courseName: '미적분 II 8주', date: '2026.03', rating: 4,
      content: '설명이 정말 명쾌하고 예제가 풍부해요. 다음 학기에도 꼭 등록할 예정입니다.',
    },
  ],
  teacher: {
    id: 1, name: '박지훈', school: '서울대학교 수학과',
    naegong: 1284, avatar: 'c1', initial: '박',
    rating: 4.9, students: 1284, years: 8,
    intro: '수능 수학 킬러문항 전문가. 8년간 200명 이상을 지도, 평균 수능 수학 1등급 달성.',
  },
}
