/**
 * @file teacherDetail.js
 * @description 선생님 상세 페이지(TeacherDetailPage.jsx)에서 사용하는 상세 더미 데이터입니다.
 * - API 연결 없이 사용되므로 고품질의 박지훈 선생님 데이터를 포함하고 있습니다.
 */

export const teacherDetail = {
  id: 1,
  name: '박지훈',
  subject: '수학',
  detailSubject: '수학 · 미적분 · 기하',
  education: '서울대학교 수학과 재학 · 과외 경력 8년 · 남 · 28세 · 서울 관악',
  avatar: '박',
  avatarColorClass: 'a-pink',
  rating: 4.9,
  students: 1284,
  naegongScore: 1284,
  years: 8,
  isCert: true,
  isTop: true,
  introduction: {
    highlight: '수학은 외우는 게 아니라 직접 풀어봐야 는다',
    text: '안녕하세요, 서울대 수학과 박지훈입니다. 8년간 200명이 넘는 학생을 가르치며 깨달은 건, 수학은 외우는 게 아니라 직접 풀어봐야 는다는 거예요. 그래서 저는 공유 화이트보드 위에서 학생이 직접 펜을 들고 풀게 하고, 막히는 순간 바로 옆에서 첨삭합니다. 킬러문항도 원리만 잡으면 무섭지 않아요. 함께 1등급 만들어봐요!'
  },
  details: {
    educationDetail: '서울대학교 수학과 재학 (4학년)',
    careerDetail: '대치동 수학 학원 강사 3년 · 1:1 과외 5년',
    awardsDetail: '한국수학올림피아드(KMO) 은상 · 대학 수학경시 대상',
    methodDetail: '양방향 화이트보드 · 학생 주도 문제풀이 · 주간 피드백 리포트'
  },
  courses: [
    {
      id: 101,
      title: '[수능대비] 미적분 II 킬러문항 완전정복 8주',
      subjectName: '수학',
      targetGrade: '고3',
      status: 'RECRUITING',
      pricePerSession: 24500,
      durationMinutes: 90,
      maxStudents: 6
    },
    {
      id: 102,
      title: '[기초마스터] 기하학 기본 개념 및 증명 정복',
      subjectName: '수학',
      targetGrade: '고2',
      status: 'IN_PROGRESS',
      pricePerSession: 22000,
      durationMinutes: 90,
      maxStudents: 8
    }
  ],
  reviews: [
    {
      id: 1,
      initial: '서',
      avatarColorClass: 'a-blue',
      name: '서*윤',
      courseName: '미적분 II',
      date: '2026.05',
      rating: 5,
      content: '설명이 진짜 쉬워요. 제가 직접 풀게 하시니까 시험장에서도 안 떨려요!'
    },
    {
      id: 2,
      initial: '김',
      avatarColorClass: 'a-yellow',
      name: '김*은',
      courseName: '기하',
      date: '2026.04',
      rating: 5,
      content: '아이가 수학을 좋아하게 됐어요. 매주 리포트도 꼼꼼히 보내주세요.'
    }
  ],
  naegongDetails: [
    { label: '답변 채택 보너스', points: 350 },
    { label: '리뷰 평점 우수 보너스', points: 400 },
    { label: '수강 완료 누적 점수', points: 534 }
  ]
}
