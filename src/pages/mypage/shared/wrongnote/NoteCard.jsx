import { formatDate, stripImageMarkdown } from './noteUtils.jsx'

export default function NoteCard({ note, active, onClick }) {
  const preview = stripImageMarkdown(note.questionContent || note.answerContent || note.memo) || '이미지가 첨부된 오답노트입니다.'

  return (
    <button className={`wan-card${active ? ' is-active' : ''}`} onClick={onClick}>
      <span className="wan-card-top">
        <span className="wan-subject-chip">{note.subjectName || '과목 없음'}</span>
        <span className="wan-card-date">{formatDate(note.updatedAt || note.createdAt)}</span>
      </span>
      <strong>{note.title}</strong>
      <span className="wan-card-preview">{preview}</span>
      <span className="wan-tag-row">
        {(note.tags ?? []).slice(0, 3).map(tag => (
          <span key={tag}>#{tag}</span>
        ))}
      </span>
    </button>
  )
}
