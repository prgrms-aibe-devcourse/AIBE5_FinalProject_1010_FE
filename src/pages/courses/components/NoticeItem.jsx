import { fmtDate, attachmentIcon, fmtBytes } from '../courseUtils.js'
import AttachmentList from './AttachmentList.jsx'

/**
 * 공지사항 아코디언 아이템.
 * 접힌 상태: 제목 + 2줄 미리보기 + 메타
 * 펼친 상태: 전체 내용 + 첨부파일 + 수정/삭제 버튼
 */
export default function NoticeItem({ notice, isTeacher, isExpanded, onToggle, onEdit, onDelete }) {
  return (
    <div
      className={`db-notice${notice.important ? ' important' : ''}${isExpanded ? ' expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="db-notice__icon">{notice.important ? '🔔' : '📋'}</div>
      <div className="db-notice__body">

        {/* 제목 행 */}
        <div className="db-notice__head">
          <div className="db-notice__title">
            {notice.title}
            {notice.important && <span className="db-imp-badge">중요</span>}
          </div>
          <span className="db-notice__chevron">{isExpanded ? '▲' : '▼'}</span>
        </div>

        {/* 접힌 상태 */}
        {!isExpanded && (
          <>
            <p className="db-notice__preview">{notice.content}</p>
            <div className="db-notice__meta">
              <span>{notice.authorName}</span>
              <span>·</span>
              <span>{fmtDate(notice.createdAt)}</span>
              {notice.attachments?.length > 0 && (
                <span className="db-notice__attach-count">📎 {notice.attachments.length}</span>
              )}
            </div>
          </>
        )}

        {/* 펼친 상태 */}
        {isExpanded && (
          <>
            <p className="db-notice__content">{notice.content}</p>

            <AttachmentList attachments={notice.attachments} />

            <div className="db-notice__meta">
              <span>{notice.authorName}</span>
              <span>·</span>
              <span>{fmtDate(notice.createdAt)}</span>
              {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                <span className="db-notice__edited">(수정됨)</span>
              )}
            </div>

            {isTeacher && (
              <div className="db-notice__actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                >
                  수정
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--coral-dark)' }}
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                >
                  삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
