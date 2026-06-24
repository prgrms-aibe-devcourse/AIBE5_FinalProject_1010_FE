import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { normalizeMath } from '../../../../utils/aiMarkdown.js'
import { toAbsoluteFileUrl } from '../../../../api/fileApi.js'

export const SOURCE_LABEL = {
  DIRECT: '직접 작성',
  QNA: '질문게시판',
  AI: 'AI 질문',
}

export function toForm(note) {
  return {
    subjectId: note?.subjectId ? String(note.subjectId) : '',
    title: note?.title ?? '',
    questionContent: note?.questionContent ?? '',
    answerContent: note?.answerContent ?? '',
    wrongReason: note?.wrongReason ?? '',
    explanation: note?.explanation ?? '',
    memo: note?.memo ?? '',
    tagsText: note?.tags?.join(', ') ?? '',
  }
}

export function toPayload(form) {
  return {
    subjectId: form.subjectId ? Number(form.subjectId) : null,
    title: form.title.trim(),
    questionContent: form.questionContent.trim(),
    answerContent: form.answerContent.trim() || null,
    wrongReason: form.wrongReason.trim() || null,
    explanation: form.explanation.trim() || null,
    memo: form.memo.trim() || null,
    tags: form.tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean),
  }
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function stripImageMarkdown(text) {
  return (text ?? '').replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
}

export function subjectNameOf(subjects, subjectId) {
  const found = subjects.find(subject => String(subject.subjectId) === String(subjectId))
  return found?.name ?? '과목 없음'
}

const noteMarkdownComponents = {
  img: ({ src, alt }) => (
    <img className="wan-content-image" src={toAbsoluteFileUrl(src)} alt={alt || '오답노트 첨부 이미지'} loading="lazy" />
  ),
}

export function NoteContent({ text }) {
  if (!text) return null
  return (
    <div className="wan-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={noteMarkdownComponents}
      >
        {normalizeMath(text)}
      </ReactMarkdown>
    </div>
  )
}
