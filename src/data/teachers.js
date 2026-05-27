/**
 * @file teachers.js
 * @description 인기 선생님 TOP 섹션에서 사용하는 선생님 더미 데이터입니다.
 * - rating/students/years는 카드 하단 통계로 표시됩니다.
 * - rank는 현재 문자열 그대로 화면에 노출되므로 이모지까지 포함합니다.
 */
/**
 * 인기 선생님 데이터 (메인 페이지 TopTeachers + Teachers 페이지)
 */
// 선생님 카드 필드
// rank/name/subject/school: 카드 텍스트
// avatar/initial: Avatar 컴포넌트 색상과 이니셜
// rating/students/years: 카드 하단 통계
export const topTeachers = [
  { id: 1, rank: '🥇 1위', name: '박지훈 선생님', subject: '수학 · 미적분',
    school: '서울대학교 수학과', avatar: 'c1', initial: '박',
    rating: 4.9, students: 1284, years: 8 },
  { id: 2, rank: '🥈 2위', name: '이수연 선생님', subject: '영어 · 문법/독해',
    school: '연세대학교 영문과', avatar: 'c2', initial: '이',
    rating: 4.9, students: 1120, years: 6 },
  { id: 3, rank: '🥉 3위', name: '김민수 선생님', subject: '물리 · 화학',
    school: 'KAIST 물리학과', avatar: 'c3', initial: '김',
    rating: 4.8, students: 892, years: 5 },
  { id: 4, rank: '⭐ 4위', name: '최영주 선생님', subject: '화학 · 생명과학',
    school: '고려대학교 화학과', avatar: 'c4', initial: '최',
    rating: 4.8, students: 764, years: 7 },
]
