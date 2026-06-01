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

/**
 * 수업 검색 페이지용 전체 선생님 데이터셋 (15명으로 증설 완료)
 */
export const teachers = [
  { id: 1, name: '박지훈', subject: '수학', detailSubject: '미적분 · 기하 📐',
    school: '서울대학교 수학과', rank: 1284, avatar: 'c1', initial: '박',
    rating: 4.9, count: 284, years: 8, students: 1284,
    tags: ['고3', '수능전문', '실시간'], intro: '개념부터 킬러문항까지, 명쾌한 수능 수학의 해답을 제시합니다.' },
  { id: 2, name: '이수연', subject: '영어', detailSubject: '영문법 · 독해 ✏️',
    school: '연세대학교 영문과', rank: 1120, avatar: 'c2', initial: '이',
    rating: 4.9, count: 192, years: 6, students: 1120,
    tags: ['중3', '고1', '내신대비'], intro: '지루한 문법은 가라! 패턴으로 직관적으로 이해하는 영문법 마스터 클래스.' },
  { id: 3, name: '김민수', subject: '과학', detailSubject: '물리 역학 🚀',
    school: 'KAIST 물리학과', rank: 892, avatar: 'c3', initial: '김',
    rating: 4.8, count: 156, years: 5, students: 892,
    tags: ['고2', '물리전문', '수능대비'], intro: '어려운 물리 공식을 쉽고 명쾌한 현실 예시와 실험으로 해결합니다.' },
  { id: 4, name: '최영주', subject: '과학', detailSubject: '화학 I · II 🧪',
    school: '고려대학교 화학과', rank: 764, avatar: 'c4', initial: '최',
    rating: 4.8, count: 128, years: 7, students: 764,
    tags: ['고1', '고2', '화학정복'], intro: '분자 구조와 원소의 세계를 시각적으로 흥미롭게 풀어내는 화학 전문가.' },
  { id: 5, name: '정현우', subject: '코딩', detailSubject: '알고리즘 💻',
    school: '포스텍 컴공', rank: 642, avatar: 'c5', initial: '정',
    rating: 4.9, count: 312, years: 4, students: 642,
    tags: ['대학생', '코딩테스트', '실시간'], intro: '코딩테스트 단기 합격을 위한 최적의 알고리즘 핵심 패턴 30선 전수!' },
  { id: 6, name: '한지원', subject: '국어', detailSubject: '비문학 독해 📖',
    school: '서울대학교 국문과', rank: 528, avatar: 'c6', initial: '한',
    rating: 4.7, count: 98, years: 5, students: 528,
    tags: ['고3', '수능대비', '비문학'], intro: '수능 국어 비문학의 거대한 지문을 구조적으로 해부하는 완벽한 독해 공식.' },
  { id: 7, name: '윤서연', subject: '수학', detailSubject: '수학 I · II 📈',
    school: '서울대 수학교육', rank: 412, avatar: 'c1', initial: '윤',
    rating: 4.7, count: 64, years: 3, students: 412,
    tags: ['고1', '기초수학', '내신전문'], intro: '수포자 대환영! 수학에 흥미를 붙이고 기초를 탄탄히 다지는 밀착 학습.' },
  { id: 8, name: '강민호', subject: '과학', detailSubject: '생명과학 🧬',
    school: '서울대 생명과학', rank: 720, avatar: 'c4', initial: '강',
    rating: 4.8, count: 214, years: 6, students: 720,
    tags: ['고2', '생명과학', '녹화강의'], intro: '복잡한 유전과 진화 메커니즘을 그림과 도표로 한눈에 정리합니다.' },
  { id: 9, name: '조유진', subject: '영어', detailSubject: '회화 · 토익 🗣️',
    school: '이화여대 영문과', rank: 630, avatar: 'c5', initial: '조',
    rating: 4.9, count: 185, years: 5, students: 630,
    tags: ['성인', '실무회화', '실시간'], intro: '실생활 비즈니스 표현과 시험 대비 영어를 한 번에 끝내는 실전 회화 클래스.' },
  { id: 10, name: '임재혁', subject: '코딩', detailSubject: '웹 프로그래밍 🌐',
    school: '한양대 컴공', rank: 550, avatar: 'c2', initial: '임',
    rating: 4.7, count: 87, years: 4, students: 550,
    tags: ['초등', '중등', '스크래치'], intro: '아이들의 창의력을 키우는 흥미진진한 블록 코딩 및 파이썬 입문 과정.' },
  { id: 11, name: '송은우', subject: '국어', detailSubject: '현대소설 · 시 🌸',
    school: '서강대 국문과', rank: 490, avatar: 'c3', initial: '송',
    rating: 4.8, count: 76, years: 5, students: 490,
    tags: ['고1', '고2', '내신국어'], intro: '수능 문학과 내신 필수 작품들을 이야기처럼 쉽고 흥미진진하게 해설합니다.' },
  { id: 12, name: '백하은', subject: '수학', detailSubject: '중등 대수 · 기하 📐',
    school: '고려대 수학교육', rank: 680, avatar: 'c6', initial: '백',
    rating: 4.9, count: 145, years: 6, students: 680,
    tags: ['중1', '중2', '심화수학'], intro: '어려워지는 중학교 수학 개념을 한눈에 그려주는 직관적인 마인드맵 수학.' },
  { id: 13, name: '권도윤', subject: '과학', detailSubject: '지구과학 I 🌍',
    school: '연세대 지구시스템', rank: 390, avatar: 'c1', initial: '권',
    rating: 4.6, count: 53, years: 3, students: 390,
    tags: ['고3', '지구과학', '녹화강의'], intro: '우주와 지구의 신비를 수능 빈출 포인트만 콕 찝어 단기에 암기하는 지구과학.' },
  { id: 14, name: '서유나', subject: '영어', detailSubject: '초등 파닉스 📚',
    school: '성균관대 영문과', rank: 710, avatar: 'c4', initial: '서',
    rating: 4.9, count: 220, years: 7, students: 710,
    tags: ['초등', '놀이영어', '기초회화'], intro: '알파벳 발음부터 자연스러운 영어 책 읽기까지, 아이와 함께 호흡하는 즐거운 파닉스.' },
  { id: 15, name: '황준영', subject: '코딩', detailSubject: '앱 개발 (Flutter) 📱',
    school: '서울대 컴공', rank: 820, avatar: 'c5', initial: '황',
    rating: 4.8, count: 180, years: 6, students: 820,
    tags: ['대학생', '앱제작', '실시간'], intro: '단 한 번의 학습으로 Android와 iOS 전용 앱을 직접 만들어 런칭하는 실전 프로젝트.' }
]
