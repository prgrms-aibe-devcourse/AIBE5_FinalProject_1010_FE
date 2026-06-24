/**
 * @file courses.js
 * @description 검색 페이지에서 렌더링하는 강의 카드 더미 데이터입니다.
 * - CourseCard.jsx가 이 객체 구조를 그대로 사용합니다.
 * - 백엔드 연동 시 API 응답 필드명을 이 구조에 맞추거나 매핑 함수를 만들면 됩니다.
 * - isBest/isLive/isHot/isNew/isFree 값은 카드 상단 배지 노출 여부를 결정합니다.
 */
/**
 * 강의 데이터 (Search 페이지)
 */
// 데이터 필드 빠른 설명
// id: React key 및 식별자
// bg: 썸네일 배경 클래스(bg1~bg6)
// subject/hand/title: 카드 상단과 제목 문구
// subjectTag/grade/mode: 카드 메타 배지
// teacher/school/rank/avatar/initial: 선생님 정보
// rating/count/price/originalPrice/discount: 평점/리뷰/가격 표시
// isBest/isLive/isHot/isNew/isFree: 조건부 배지 표시 여부
export const courses = [
  { id: 1, bg: 'bg1', subject: '미적분 II', hand: '킬러문항 ⚡',
    title: '[수능대비] 미적분 II 킬러문항 완전정복 8주',
    subjectTag: '수학', grade: '고3', mode: '실시간',
    teacher: '박지훈', school: '서울대 수학과', rank: 1284,
    avatar: 'c1', initial: '박', rating: 4.9, count: 284,
    price: 196000, originalPrice: 280000, discount: 30,
    isBest: true, isLive: true },
  { id: 2, bg: 'bg2', subject: '영문법', hand: '분사구문 ✏️',
    title: '중3 영문법 - 분사구문부터 가정법까지 완벽정리',
    subjectTag: '영어', grade: '중3', mode: '실시간',
    teacher: '이수연', school: '연세대 영문과', rank: 1120,
    avatar: 'c2', initial: '이', rating: 4.9, count: 192,
    price: 128000, isNew: true },
  { id: 3, bg: 'bg3', subject: '물리 역학', hand: '에너지보존 🚀',
    title: '고2 물리 - 운동 법칙과 에너지 보존',
    subjectTag: '물리', grade: '고2', mode: '녹화+실시간',
    teacher: '김민수', school: 'KAIST 물리학과', rank: 892,
    avatar: 'c3', initial: '김', rating: 4.8, count: 156,
    price: 184000, isHot: true },
  { id: 4, bg: 'bg4', subject: '화학 I', hand: '분자구조 🧪',
    title: '화학 I - 화학결합 · 분자구조 마스터 클래스',
    subjectTag: '화학', grade: '고2', mode: '실시간',
    teacher: '최영주', school: '고려대 화학과', rank: 764,
    avatar: 'c4', initial: '최', rating: 4.8, count: 128,
    price: 142000, isFree: true },
  { id: 5, bg: 'bg5', subject: '알고리즘', hand: '코딩테스트 💻',
    title: '코딩테스트 합격 - 알고리즘 핵심 패턴 30선',
    subjectTag: '코딩', grade: '대학생', mode: '실시간',
    teacher: '정현우', school: '포스텍 컴공', rank: 642,
    avatar: 'c5', initial: '정', rating: 4.9, count: 312,
    price: 216000, discount: 20, isBest: true },
  { id: 6, bg: 'bg6', subject: '국어 비문학', hand: '독해전략 📖',
    title: '고3 국어 - 비문학 독해 전략 마스터',
    subjectTag: '국어', grade: '고3', mode: '실시간',
    teacher: '한지원', school: '서울대 국문과', rank: 528,
    avatar: 'c6', initial: '한', rating: 4.7, count: 98,
    price: 156000, isHot: true },
  { id: 7, bg: 'bg2', subject: '수학 I', hand: '함수와 그래프 📈',
    title: '고1 수학 I - 함수와 그래프 기초부터 응용까지',
    subjectTag: '수학', grade: '고1', mode: '실시간',
    teacher: '윤서연', school: '서울대 수학교육', rank: 412,
    avatar: 'c1', initial: '윤', rating: 4.7, count: 64,
    price: 112000, isNew: true, isFree: true },
  { id: 8, bg: 'bg3', subject: '생명과학 II', hand: '유전과 진화 🧬',
    title: '생명과학 II - 유전과 진화 핵심 정리',
    subjectTag: '생명', grade: '고2', mode: '녹화',
    teacher: '강민호', school: '서울대 생명과학', rank: 720,
    avatar: 'c4', initial: '강', rating: 4.8, count: 214,
    price: 168000, isBest: true },
  { id: 9, bg: 'bg5', subject: '토익 800+', hand: '단기완성 ⏰',
    title: '토익 800+ 단기 완성 8주 부트캠프',
    subjectTag: '영어', grade: '성인', mode: '실시간',
    teacher: '민예진', school: '이화여대 영문과', rank: 588,
    avatar: 'c6', initial: '민', rating: 4.9, count: 412,
    price: 204000, discount: 15, isHot: true },
]
