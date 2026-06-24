/**
 * @file MessageBubble.jsx
 * @description 채팅 대화의 말풍선 한 개를 그리는 컴포넌트입니다.
 * - role === 'user' 이면 오른쪽 정렬(코랄 계열), 'ai' 이면 왼쪽 정렬(민트 계열).
 * - 새 말풍선은 CSS 애니메이션(ai-bubble-in)으로 아래에서 떠오르며 나타납니다.
 * - AI 답변은 Markdown(제목/굵게/목록/표/코드)과 LaTeX 수식(\frac 등)을 실제로 렌더링합니다.
 *   사용자가 입력한 메시지는 의도치 않은 서식 해석을 막기 위해 평문 그대로 출력합니다.
 * - 첨부 이미지(images)는 본문 위에 썸네일로, AI가 생성한 이미지는 답변 마크다운의 <img>로 표시됩니다.
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { toAbsoluteFileUrl } from '../../api/fileApi.js'
import { normalizeMath } from '../../utils/aiMarkdown.js'

// 마크다운 안의 이미지(특히 AI가 생성한 /uploads 이미지)는 백엔드 오리진을 붙여 절대 URL로 띄운다.
const markdownComponents = {
  img: ({ src, alt }) => (
    <img className="ai-md-image" src={toAbsoluteFileUrl(src)} alt={alt || ''} loading="lazy" />
  ),
}

/**
 * 말풍선 하나.
 * @param {'user'|'ai'} role  메시지 작성 주체
 * @param {string} text       메시지 본문(줄바꿈 \n 포함 가능)
 * @param {string} [time]     표시할 시각 문자열
 * @param {string[]} [images] 첨부 이미지 URL 목록(주로 사용자 질문 첨부)
 */
export default function MessageBubble({ role, text, time, images = [] }) {
  const isAi = role === 'ai'
  const hasImages = images && images.length > 0

  return (
    <div className={`ai-msg ${role}`}>
      {/* AI 메시지에만 아바타(별 마스코트)를 붙입니다. */}
      {isAi && <div className="ai-msg-avatar">✨</div>}

      <div className="ai-msg-body">
        {/* 작성자 라벨 */}
        <div className="ai-msg-name">{isAi ? 'StudyFlow AI' : '나'}</div>

        {/* 첨부 이미지 썸네일 */}
        {hasImages && (
          <div className="ai-msg-images">
            {images.map((url, i) => (
              <a key={i} href={toAbsoluteFileUrl(url)} target="_blank" rel="noreferrer">
                <img src={toAbsoluteFileUrl(url)} alt={`첨부 이미지 ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}

        {/* 본문 (텍스트가 있을 때만) */}
        {text && (
          isAi ? (
            // AI: Markdown + 수식 렌더링. 스트리밍 중에도 토큰이 쌓일 때마다 다시 그려진다.
            <div className="ai-bubble ai-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {normalizeMath(text)}
              </ReactMarkdown>
            </div>
          ) : (
            // 사용자: \n 기준으로 줄을 나눠 평문 문단으로 출력합니다.
            <div className="ai-bubble">
              {text.split('\n').map((line, i) =>
                line === ''
                  ? <span key={i} className="ai-bubble-gap" />
                  : <p key={i} className="ai-bubble-line">{line}</p>
              )}
            </div>
          )
        )}

        {time && <div className="ai-msg-time">{time}</div>}
      </div>
    </div>
  )
}
