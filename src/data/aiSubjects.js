/**
 * @file aiSubjects.js
 * @description AI 질문 페이지(/ai)에서 쓰는 더미 데이터와 가짜 답변 생성기입니다.
 * - 백엔드(Spring API) 연동 전까지 화면을 채우고 동작을 흉내 내기 위한 목업입니다.
 * - 실연동 시 과목 목록은 `GET /api/v1/subjects`, 질문 기록은 `GET /api/v1/ai/questions`,
 *   질문 요청은 `POST /api/v1/ai/questions`(명세 §26)로 교체합니다.
 *
 * ⚠️ 주의: 아래 과목 id(1~6)는 화면 확인용 하드코딩입니다.
 *   실제로는 subject 테이블의 subjectId를 사용해야 하므로 연동 시 반드시 교체하세요.
 */

/**
 * 과목 칩 / 선택 바에 쓰는 과목 데이터.
 * - id     : 명세상 subjectId 자리(현재는 임시값)
 * - name   : 과목명
 * - icon   : 칩에 표시할 이모지
 * - color  : common.css의 badge/avatar 색 토큰 계열(mint/sky/butter/peach/lavender)
 * - desc   : 과목 부제(어떤 걸 물어볼 수 있는지 힌트)
 * - examples: 빈 화면(EmptyState)에서 보여줄 예시 질문 문장들
 */
export const aiSubjects = [
  {
    id: 1,
    name: '수학',
    icon: '🧮',
    color: 'mint',
    desc: '미적분 · 기하 · 확률과 통계',
    examples: [
      'f(x)=x²에서 x=3일 때 미분계수를 구해줘',
      '등비수열의 합 공식을 유도 과정과 함께 설명해줘',
      '이 이차함수의 최댓값을 구하는 방법을 알려줘',
    ],
  },
  {
    id: 2,
    name: '과학',
    icon: '🔬',
    color: 'sky',
    desc: '물리 · 화학 · 생명 · 지구과학',
    examples: [
      '운동량 보존 법칙을 예시와 함께 설명해줘',
      '산-염기 중화 반응에서 pH 변화를 알려줘',
      '광합성과 호흡의 차이를 표로 정리해줘',
    ],
  },
  {
    id: 3,
    name: '국어',
    icon: '📖',
    color: 'butter',
    desc: '문학 · 문법 · 비문학 독해',
    examples: [
      '이 시의 화자가 느끼는 정서를 분석해줘',
      '안긴문장과 안은문장의 차이를 알려줘',
      '비문학 지문에서 주제를 빠르게 찾는 방법은?',
    ],
  },
  {
    id: 4,
    name: '영어',
    icon: '🌍',
    color: 'peach',
    desc: '문법 · 독해 · 어휘 · 작문',
    examples: [
      '관계대명사 which와 that의 차이를 설명해줘',
      '이 문장을 가정법 과거로 바꿔줘',
      '수능 빈칸 추론 문제 푸는 전략을 알려줘',
    ],
  },
  {
    id: 5,
    name: '코딩',
    icon: '💻',
    color: 'lavender',
    desc: '알고리즘 · 자료구조 · 디버깅',
    examples: [
      '버블 정렬과 퀵 정렬의 시간복잡도를 비교해줘',
      '이 파이썬 코드가 왜 무한 루프에 빠지는지 알려줘',
      '재귀와 반복문 중 어떤 걸 써야 할까?',
    ],
  },
  {
    id: 6,
    name: '사회',
    icon: '🌐',
    color: 'mint',
    desc: '한국사 · 사회문화 · 경제',
    examples: [
      '수요와 공급 곡선이 이동하는 원리를 설명해줘',
      '조선 후기 붕당 정치의 흐름을 정리해줘',
      '기회비용과 매몰비용의 차이를 예시로 알려줘',
    ],
  },
]

/**
 * 좌측 "질문 기록" 사이드바에 표시할 더미 데이터.
 * - 실연동 시 `GET /api/v1/ai/questions` 응답(data[])으로 교체합니다.
 *   응답 항목: { aiQuestionId, subject:{subjectId,name}, questionText, createdAt }
 * - 여기서는 화면 구성을 위해 subjectId / title / time 정도만 둡니다.
 */
export const initialHistory = [
  { aiQuestionId: 101, subjectId: 1, title: '미분계수 구하는 법', time: '방금 전' },
  { aiQuestionId: 102, subjectId: 5, title: '퀵 정렬 시간복잡도', time: '1시간 전' },
  { aiQuestionId: 103, subjectId: 4, title: '가정법 과거 변환', time: '어제' },
  { aiQuestionId: 104, subjectId: 2, title: '광합성 vs 호흡', time: '2일 전' },
]

/**
 * 가짜 AI 답변 생성기.
 * - 실제로는 서버(Spring)가 AI에 풀이를 요청해 answerText를 돌려주지만,
 *   목업 단계에서는 과목명과 질문을 섞어 그럴듯한 문자열을 만들어 반환합니다.
 * - 실연동 시 이 함수 대신 POST /api/v1/ai/questions 응답의 data.answerText를 사용하세요.
 *
 * @param {string} subjectName 선택된 과목명 (예: '수학')
 * @param {string} questionText 사용자가 입력한 질문
 * @returns {string} 여러 줄로 된 가짜 풀이 텍스트
 */
export function mockAnswer(subjectName, questionText) {
  const trimmed = questionText.trim()
  return [
    `좋은 질문이에요! "${trimmed}" 에 대해 ${subjectName} 관점에서 풀어볼게요. ✨`,
    '',
    '1️⃣ 먼저 문제에서 주어진 조건을 정리합니다.',
    '2️⃣ 핵심 개념을 적용해 단계별로 식을 세웁니다.',
    '3️⃣ 계산 과정을 하나씩 확인하며 답을 도출합니다.',
    '',
    '📌 지금은 데모 응답이에요. 백엔드(Spring API) 연동 후에는 실제 AI 풀이가 이 자리에 표시됩니다.',
  ].join('\n')
}
