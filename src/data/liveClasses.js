/**
 * @file liveClasses.js
 * @description 메인 페이지 LIVE NOW 섹션의 진행 중 수업 더미 데이터입니다.
 * - 실제 서비스에서는 현재 진행 중인 강의 목록 API로 교체될 영역입니다.
 * - viewers는 카드 우상단 참여자 수로 표시됩니다.
 */
/**
 * 지금 진행 중인 라이브 수업 (메인 페이지 LiveNow 섹션)
 */
// 라이브 수업 카드 필드
// bg: 썸네일 배경 클래스, subject/hand/title: 수업 표시 문구
// teacher/school/avatar/initial: 진행 선생님 정보, viewers: 현재 시청/참여자 수
export const liveClasses = [
  {
    id: 1, bg: 'bg1',
    subject: '미적분 II',
    hand: '킬러문항 ⚡',
    title: '[수능대비] 미적분 II 킬러문항 마스터',
    teacher: '박지훈',
    school: '서울대',
    avatar: 'c1',
    initial: '박',
    viewers: 24,
  },
  {
    id: 2, bg: 'bg2',
    subject: '물리 역학',
    hand: '운동의 법칙 🚀',
    title: '고2 물리 - 운동 법칙 완전정복',
    teacher: '김민수',
    school: 'KAIST',
    avatar: 'c2',
    initial: '김',
    viewers: 18,
  },
  {
    id: 3, bg: 'bg3',
    subject: '영어 문법',
    hand: '분사구문 ✏️',
    title: '중3 영어 - 분사구문 완벽 정리',
    teacher: '이수연',
    school: '연세대',
    avatar: 'c3',
    initial: '이',
    viewers: 31,
  },
  {
    id: 4, bg: 'bg4',
    subject: '화학 I',
    hand: '분자구조 🧪',
    title: '화학 I - 화학결합과 분자구조',
    teacher: '최영주',
    school: '고려대',
    avatar: 'c4',
    initial: '최',
    viewers: 15,
  },
]
