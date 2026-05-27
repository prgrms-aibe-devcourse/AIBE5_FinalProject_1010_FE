/**
 * @file questions.js
 * @description 메인 페이지 질문게시판 미리보기용 질문 더미 데이터입니다.
 * - QnaBoardSection.jsx가 이 배열을 map으로 렌더링합니다.
 * - imageType 값이 있으면 QnaImages.jsx의 손그림 SVG가 함께 표시됩니다.
 * - answersCls 값은 답변 배지의 강조 스타일과 연결됩니다.
 */
/**
 * 학생 질문게시판 데이터 (메인 페이지 QnA 섹션)
 * - withImage: SVG 이미지 컴포넌트 함수 (선택)
 */

// 질문 객체 구조
// tags: Badge 컴포넌트로 렌더링되는 태그 배열
// title/body: 질문 제목과 본문 요약
// author: 작성자 아바타 표시 정보
// answersCls/answersLabel: 답변 수 배지 스타일과 문구
// imageType: math | physics | chemistry | null, QnaImages.jsx와 연결
export const questions = [
  {
    id: 1,
    tags: [{ label: '수학', cls: 'peach' }, { label: '고3', cls: '' }, { label: '미적분', cls: 'butter' }],
    title: 'f(x) = x³ - 3x² + 2 의 극값을 어떻게 구해야 하나요?',
    body: '사진처럼 풀어봤는데 극댓값이 -2가 나와서 이상해요. 도함수 = 0 인 x값까지는 구했는데 그 다음 부호 변화를 어떻게 표로 정리해야 할지 모르겠어요. 답안 좀 봐주세요 ㅠㅠ',
    author: { name: '김민지', avatar: 'c3', initial: '민' },
    time: '23분 전',
    answers: 4,
    answersCls: 'hot',
    answersLabel: '🔥 답변 4',
    imageType: 'math',
  },
  {
    id: 2,
    tags: [{ label: '영어', cls: 'peach' }, { label: '중3', cls: '' }, { label: '문법', cls: 'butter' }, { label: '✓ 해결됨', cls: 'sky' }],
    title: '관계대명사 that과 which 의 차이점이 헷갈려요',
    body: '내신 시험이 다음 주인데 둘 다 사물을 받을 수 있다고 해서 정확히 언제 어느 걸 써야 할지 모르겠어요. 특히 콤마(,) 뒤에 쓸 때 차이가 있다는 게 무슨 말인지 헷갈립니다. 예시 들어서 알려주실 분 계신가요?',
    author: { name: '이재섭', avatar: 'c2', initial: '재' },
    time: '1시간 전',
    answers: 7,
    answersCls: 'resolved',
    answersLabel: '⭐ 답변 7',
    imageType: null,
  },
  {
    id: 3,
    tags: [{ label: '물리', cls: 'peach' }, { label: '고2', cls: '' }, { label: '역학', cls: 'mint' }],
    title: '빗면 위에서 운동하는 물체의 자유물체도 어떻게 그려야 하나요?',
    body: '빗면 각도 30°, 질량 2kg일 때 마찰이 없다면 가속도가 얼마나 나오나요? 그림 첨부했어요 — 중력을 빗면 방향이랑 수직 방향으로 분해하는 부분에서 막혔습니다.',
    author: { name: '박서준', avatar: 'c4', initial: '서' },
    time: '3시간 전',
    answers: 3,
    answersCls: '',
    answersLabel: '답변 3',
    imageType: 'physics',
  },
  {
    id: 4,
    tags: [{ label: '코딩', cls: 'peach' }, { label: '대학생', cls: '' }, { label: '알고리즘', cls: 'lavender' }],
    title: 'DFS와 BFS, 언제 무엇을 써야 하나요?',
    body: '코딩테스트 그래프 문제에서 항상 헷갈립니다. "최단 경로" 이런 키워드 나오면 BFS 라고 들었는데 구체적으로 어떤 기준으로 골라야 하는지, 시간복잡도는 어떻게 다른지 정리해주실 분 있나요?',
    author: { name: '윤예린', avatar: 'c5', initial: '예' },
    time: '어제',
    answers: 9,
    answersCls: 'hot',
    answersLabel: '🔥 답변 9',
    imageType: null,
  },
  {
    id: 5,
    tags: [{ label: '화학', cls: 'peach' }, { label: '고2', cls: '' }, { label: '분자구조', cls: 'mint' }],
    title: 'H₂O 분자의 결합각이 104.5° 인 이유가 뭔가요?',
    body: '교과서에서 그림은 봤는데 왜 정사면체 각도인 109.5°가 아니라 104.5° 인지 이해가 안 돼요. 비공유 전자쌍이 어떤 영향을 주는지 차근차근 알려주세요.',
    author: { name: '최하윤', avatar: 'c1', initial: '하' },
    time: '5시간 전',
    answers: 5,
    answersCls: 'resolved',
    answersLabel: '⭐ 답변 5',
    imageType: 'chemistry',
  },
  {
    id: 6,
    tags: [{ label: '국어', cls: 'peach' }, { label: '고3', cls: '' }, { label: '비문학', cls: 'butter' }],
    title: '비문학 지문을 시간 안에 다 못 풀어요. 빠르게 읽는 방법이 있나요?',
    body: '모의고사 보면 항상 비문학에서 2-3문제 못 풉니다. 처음부터 정독해서 그런 것 같은데, 지문 구조를 빠르게 파악하는 훈련법이 따로 있을까요?',
    author: { name: '정지호', avatar: 'c6', initial: '지' },
    time: '어제',
    answers: 6,
    answersCls: '',
    answersLabel: '답변 6',
    imageType: null,
  },
]
