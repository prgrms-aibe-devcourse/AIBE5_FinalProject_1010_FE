/**
 * @file qnaPosts.js
 * @description 질문게시판 전체 페이지용 목업 데이터입니다.
 */
import { questions } from './questions.js'

function isGradeTag(label) {
  return /^(중|고)\d$/.test(label) || label === '대학생'
}

const extraPosts = [
  {
    id: 101,
    tags: [{ label: '수학', cls: 'peach' }, { label: '고1', cls: '' }, { label: '함수', cls: 'mint' }],
    title: '이차함수 그래프를 평행이동할 때 식이 헷갈립니다',
    body: 'y = x² 그래프를 오른쪽으로 2, 위로 3 이동하면 왜 y = (x - 2)² + 3 인가요? 오른쪽 이동인데 x + 2가 아닌 이유가 이해가 안 됩니다.',
    author: { name: '한유진', avatar: 'c1', initial: '유' },
    time: '2시간 전',
    answers: 2,
    answersCls: '',
    answersLabel: '답변 2',
    imageType: null,
    views: 88,
    status: 'waiting',
  },
  {
    id: 102,
    tags: [{ label: '국어', cls: 'peach' }, { label: '고2', cls: '' }, { label: '문학', cls: 'butter' }],
    title: '시에서 화자의 정서를 찾는 기준이 있나요?',
    body: '문학 문제에서 화자의 정서를 고르는 선지가 자주 틀립니다. 감정어가 직접 안 나올 때는 어떤 표현을 보고 판단해야 하나요?',
    author: { name: '서다은', avatar: 'c4', initial: '다' },
    time: '4시간 전',
    answers: 1,
    answersCls: '',
    answersLabel: '답변 1',
    imageType: null,
    views: 64,
    status: 'waiting',
  },
  {
    id: 103,
    tags: [{ label: '영어', cls: 'peach' }, { label: '고1', cls: '' }, { label: '독해', cls: 'sky' }, { label: '해결됨', cls: 'mint' }],
    title: '빈칸 추론 문제에서 앞뒤 문장을 어떻게 연결해야 하나요?',
    body: '빈칸 앞 문장과 뒤 문장이 반대 관계인지, 같은 흐름인지 파악하는 게 어렵습니다. 접속사 없이도 흐름을 보는 방법이 있을까요?',
    author: { name: '문채원', avatar: 'c3', initial: '채' },
    time: '오늘',
    answers: 5,
    answersCls: 'resolved',
    answersLabel: '답변 5',
    imageType: null,
    views: 142,
    status: 'resolved',
  },
  {
    id: 104,
    tags: [{ label: '화학', cls: 'peach' }, { label: '고3', cls: '' }, { label: '양적관계', cls: 'lavender' }],
    title: '몰농도 계산에서 부피를 언제 L로 바꿔야 하나요?',
    body: '문제에서 mL로 주어진 부피를 그대로 넣어서 자꾸 틀립니다. 몰농도 공식에 대입할 때 단위 변환을 빠뜨리지 않는 요령이 궁금합니다.',
    author: { name: '강도윤', avatar: 'c5', initial: '도' },
    time: '어제',
    answers: 8,
    answersCls: 'hot',
    answersLabel: '답변 8',
    imageType: null,
    views: 231,
    status: 'resolved',
  },
  {
    id: 105,
    tags: [{ label: '생명과학', cls: 'peach' }, { label: '고2', cls: '' }, { label: '유전', cls: 'mint' }],
    title: '멘델 유전 가계도 문제를 빠르게 푸는 순서가 있나요?',
    body: '우성/열성 판단까지는 되는데, 유전자형을 표시하다 보면 시간이 너무 오래 걸립니다. 시험장에서 적용할 수 있는 풀이 순서를 알고 싶습니다.',
    author: { name: '오하린', avatar: 'c2', initial: '하' },
    time: '2일 전',
    answers: 0,
    answersCls: '',
    answersLabel: '답변 0',
    imageType: null,
    views: 49,
    status: 'waiting',
  },
  {
    id: 106,
    tags: [{ label: '코딩', cls: 'peach' }, { label: '대학생', cls: '' }, { label: 'React', cls: 'sky' }],
    title: 'useEffect 의존성 배열에 함수를 넣어야 하는 기준이 궁금합니다',
    body: 'ESLint가 함수를 의존성 배열에 넣으라고 하는데 넣으면 계속 다시 실행됩니다. useCallback을 언제 써야 하는지 예시로 설명 부탁드립니다.',
    author: { name: '노시현', avatar: 'c6', initial: '시' },
    time: '3일 전',
    answers: 6,
    answersCls: 'hot',
    answersLabel: '답변 6',
    imageType: null,
    views: 310,
    status: 'waiting',
  },
]

function normalizePost(post, index) {
  const originalTags = post.tags || []
  const primaryTag = originalTags[0]?.label ?? '기타'
  return {
    ...post,
    tags: originalTags.filter((tag) => !isGradeTag(tag.label)),
    views: post.views ?? 70 + index * 19,
    status: post.status ?? (post.answersCls === 'resolved' ? 'resolved' : 'waiting'),
    subject: post.subject ?? primaryTag,
    bookmarked: index % 4 === 0,
  }
}

export const qnaPosts = [...questions, ...extraPosts].map(normalizePost)

export const qnaSubjects = ['전체', '수학', '국어', '영어', '물리', '화학', '생명과학', '코딩']
