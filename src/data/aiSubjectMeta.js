/**
 * @file aiSubjectMeta.js
 * @description AI 질문 페이지의 과목 칩에 쓰는 "표시용 메타데이터"입니다.
 *
 * 백엔드 GET /api/v1/subjects 는 { subjectId, name, category }만 내려줍니다(아이콘/색/예시는 없음).
 * 화면을 예쁘게 그리기 위해, 백엔드의 category(enum 문자열)를 키로 아이콘·색·설명·예시 질문을
 * 여기서 보강합니다. → {@link decorateSubject}로 백엔드 과목과 합성해 사용합니다.
 *
 * color는 common.css의 badge/avatar 색 토큰(mint/sky/butter/peach/lavender) 계열입니다.
 */

/** SubjectCategory(백엔드 enum) → 표시 메타데이터 */
export const SUBJECT_META = {
  KOREAN: {
    icon: '📖', color: 'butter', desc: '문학 · 문법 · 독서',
    examples: [
      '이 시의 화자가 느끼는 정서를 분석해줘',
      '안긴문장과 안은문장의 차이를 알려줘',
      '비문학 지문에서 주제를 빠르게 찾는 방법은?',
    ],
  },
  ENGLISH: {
    icon: '🌍', color: 'peach', desc: '문법 · 독해 · 어휘 · 작문',
    examples: [
      '관계대명사 which와 that의 차이를 설명해줘',
      '이 문장을 가정법 과거로 바꿔줘',
      '수능 빈칸 추론 문제 푸는 전략을 알려줘',
    ],
  },
  MATH: {
    icon: '🧮', color: 'mint', desc: '미적분 · 기하 · 확률과 통계',
    examples: [
      'f(x)=x²에서 x=3일 때 미분계수를 구해줘',
      '등비수열의 합 공식을 유도 과정과 함께 설명해줘',
      '이 이차함수의 최댓값을 구하는 방법을 알려줘',
    ],
  },
  SOCIAL_STUDIES: {
    icon: '🌐', color: 'sky', desc: '생활과 윤리 · 사회문화 · 지리 · 세계사',
    examples: [
      '수요와 공급 곡선이 이동하는 원리를 설명해줘',
      '기회비용과 매몰비용의 차이를 예시로 알려줘',
      '사회문화 현상을 탐구하는 방법을 정리해줘',
    ],
  },
  SCIENCE: {
    icon: '🔬', color: 'lavender', desc: '물리 · 화학 · 생명 · 지구과학',
    examples: [
      '운동량 보존 법칙을 예시와 함께 설명해줘',
      '산-염기 중화 반응에서 pH 변화를 알려줘',
      '광합성과 호흡의 차이를 표로 정리해줘',
    ],
  },
  VOCATIONAL: {
    icon: '🛠️', color: 'butter', desc: '상업 · 공업 · 농생명 · 수산해운',
    examples: [
      '손익분기점을 구하는 방법을 알려줘',
      '복식부기에서 차변과 대변의 원리를 설명해줘',
      '마케팅의 4P가 무엇인지 예시로 정리해줘',
    ],
  },
  KOREAN_HISTORY: {
    icon: '🏛️', color: 'peach', desc: '시대 흐름 · 사건 · 사료 해석',
    examples: [
      '조선 후기 붕당 정치의 흐름을 정리해줘',
      '갑오개혁의 주요 내용을 알려줘',
      '사료를 해석할 때 시대·맥락을 파악하는 방법은?',
    ],
  },
  SECOND_LANGUAGE: {
    icon: '🗣️', color: 'mint', desc: '일본어 · 중국어 · 한문 등',
    examples: [
      '일본어 동사 て형 활용을 예문과 함께 알려줘',
      '중국어 성조를 구분하는 요령을 알려줘',
      '한문에서 자주 쓰는 허사(虛詞)를 정리해줘',
    ],
  },
}

/** category 매칭이 안 될 때(미래에 새 분류 추가 등) 쓰는 기본값. */
const FALLBACK_META = { icon: '📚', color: 'mint', desc: '', examples: [] }

/**
 * 백엔드 과목({ subjectId, name, category })에 표시 메타데이터를 합성해
 * 화면 컴포넌트가 쓰기 좋은 형태로 변환합니다.
 *
 * @returns {{ id:number, name:string, category:string, icon:string, color:string, desc:string, examples:string[] }}
 */
export function decorateSubject(subject) {
  const meta = SUBJECT_META[subject.category] ?? FALLBACK_META
  return {
    id: subject.subjectId, // 화면 컴포넌트는 subject.id 를 사용하므로 매핑
    name: subject.name,
    category: subject.category,
    ...meta,
  }
}

/** 과목 목록 전체를 표시용으로 변환. */
export function decorateSubjects(subjects) {
  return subjects.map(decorateSubject)
}
