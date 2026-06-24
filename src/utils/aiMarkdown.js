/**
 * @file aiMarkdown.js
 * @description AI 답변/오답노트의 LaTeX 수식 구분자 정규화 공용 유틸.
 *
 * GPT가 자주 쓰는 LaTeX 구분자 \( \) · \[ \] 를 remark-math가 이해하는
 * $ … $ · $$ … $$ 로 바꿔준다. (이 변환이 없으면 \frac 같은 수식이 글자 그대로 보인다)
 *
 * ⚠️ AI 채팅 말풍선(MessageBubble)과 오답노트(WrongAnswerNoteTab)가 **완전히 동일하게**
 * 렌더되도록 두 곳에서 이 함수 하나만 사용한다. (제각각 가공하면 결과가 어긋남)
 *
 * @param {string} text 원본 텍스트
 * @returns {string} 수식 구분자가 정규화된 텍스트 (그 외 내용·줄바꿈은 원본 그대로 보존)
 */
export function normalizeMath(text) {
  if (!text) return ''
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => `$${expr}$`)
}
