import { formatDate, SOURCE_LABEL, NoteContent } from './noteUtils.jsx'

export default function NoteDetail({ note, deleting, confirmDelete, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }) {
  if (!note) {
    return (
      <div className="wan-detail wan-detail--empty">
        <p className="wan-empty-mark">?</p>
        <h3>오답노트를 선택하세요</h3>
        <p>왼쪽 목록에서 기록을 누르면 문제, 풀이, 틀린 이유를 한 번에 볼 수 있습니다.</p>
      </div>
    )
  }

  return (
    <article className="wan-detail">
      <div className="wan-detail-head">
        <div>
          <div className="wan-meta-row">
            <span className="wan-subject-chip">{note.subjectName || '과목 없음'}</span>
            <span>{SOURCE_LABEL[note.sourceType] ?? note.sourceType}</span>
            <span>{formatDate(note.updatedAt || note.createdAt)}</span>
          </div>
          <h3>{note.title}</h3>
        </div>
        <div className="wan-detail-actions">
          <button className="wan-btn wan-btn--ghost" onClick={onEdit}>
            수정
          </button>
          {!confirmDelete ? (
            <button className="wan-btn wan-btn--danger" onClick={onAskDelete}>
              삭제
            </button>
          ) : (
            <div className="wan-delete-confirm">
              <span>삭제할까요?</span>
              <button onClick={onCancelDelete} disabled={deleting}>취소</button>
              <button onClick={onConfirmDelete} disabled={deleting}>{deleting ? '삭제 중' : '삭제'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="wan-detail-section">
        <span>문제</span>
        <NoteContent text={note.questionContent} />
      </div>
      {note.answerContent && (
        <div className="wan-detail-section">
          <span>정답 / 풀이</span>
          <NoteContent text={note.answerContent} />
        </div>
      )}
      {note.wrongReason && (
        <div className="wan-detail-section">
          <span>틀린 이유</span>
          <NoteContent text={note.wrongReason} />
        </div>
      )}
      {note.explanation && (
        <div className="wan-detail-section">
          <span>다음 풀이 전략</span>
          <NoteContent text={note.explanation} />
        </div>
      )}
      {note.memo && (
        <div className="wan-detail-section">
          <span>메모</span>
          <NoteContent text={note.memo} />
        </div>
      )}
      {!!note.tags?.length && (
        <div className="wan-tag-row wan-tag-row--detail">
          {note.tags.map(tag => <span key={tag}>#{tag}</span>)}
        </div>
      )}
    </article>
  )
}
