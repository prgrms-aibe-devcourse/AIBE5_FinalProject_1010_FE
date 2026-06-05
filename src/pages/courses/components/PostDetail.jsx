import { useState, useEffect } from 'react'
import { createComment, deleteComment } from '../../../api/dashboardApi.js'
import { fmtDate, avatarColor } from '../courseUtils.js'
import AttachmentList from './AttachmentList.jsx'

/**
 * 게시글 상세 뷰 — 본문 + 첨부파일 + 댓글 CRUD.
 * 댓글 상태를 내부에서 관리.
 */
export default function PostDetail({
  courseId,
  post,
  currentUserId,
  isTeacher,
  onBack,
  onEdit,
  onDeleted,
}) {
  const [comments, setComments]           = useState(post.comments ?? [])
  const [commentText, setCommentText]     = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [commentError, setCommentError]   = useState(null)

  useEffect(() => {
    setComments(post.comments ?? [])
  }, [post.id])

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentSending(true)
    setCommentError(null)
    try {
      const comment = await createComment(courseId, post.id, commentText)
      setComments((prev) => [...prev, comment])
      setCommentText('')
    } catch {
      setCommentError('댓글 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setCommentSending(false)
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('댓글을 삭제할까요?')) return
    try {
      await deleteComment(courseId, post.id, commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      setCommentError('댓글 삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const isMyPost = currentUserId && currentUserId === post.authorId
  const canDelPost = isTeacher || isMyPost
  const canDelComment = (c) => isTeacher || (currentUserId && currentUserId === c.authorId)

  return (
    <div className="db-block">

      {/* 헤더 */}
      <div className="db-post-header">
        <button className="db-back-btn" style={{ marginBottom: 14 }} onClick={onBack}>
          ← 목록
        </button>
        <h2>{post.title}</h2>
        <div className="db-post-header-meta">
          <span
            className={`avatar sm ${avatarColor(post.authorId)}`}
            style={{ width: 24, height: 24, fontSize: 10, flexShrink: 0 }}
          >
            {(post.authorName ?? '?')[0]}
          </span>
          <strong style={{ color: 'var(--ink-soft)' }}>{post.authorName}</strong>
          <span>·</span>
          <span>{fmtDate(post.createdAt)}</span>
          <span>·</span>
          <span>조회 {post.viewCount}</span>
        </div>

        {(isMyPost || canDelPost) && (
          <div className="db-post-actions">
            {isMyPost && (
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>수정</button>
            )}
            {canDelPost && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--coral-dark)' }}
                onClick={onDeleted}
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 본문 */}
      <p className="db-post-body">{post.content}</p>

      {/* 첨부파일 */}
      {post.attachments?.length > 0 && (
        <div className="db-post-attachments">
          <div className="db-post-attachments__label">📎 첨부파일 {post.attachments.length}개</div>
          <AttachmentList attachments={post.attachments} />
        </div>
      )}

      {/* 댓글 */}
      <div className="db-comments" style={{ marginTop: 24 }}>
        <div className="db-comment-section-header">
          <span>댓글</span>
          <span className="db-comment-count">{comments.length}</span>
        </div>

        {comments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600, marginBottom: 14 }}>
            첫 댓글을 남겨보세요!
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="db-comment">
            <span
              className={`avatar sm ${avatarColor(c.authorId)}`}
              style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}
            >
              {(c.authorName ?? '?')[0]}
            </span>
            <div className="db-comment__body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span className="db-comment__author">{c.authorName}</span>
                {canDelComment(c) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--coral-dark)', fontSize: 12, padding: '2px 8px' }}
                    onClick={() => handleDeleteComment(c.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="db-comment__text">{c.content}</p>
              <div className="db-comment__date">{fmtDate(c.createdAt)}</div>
            </div>
          </div>
        ))}

        {commentError && <p className="db-api-error" role="alert">{commentError}</p>}

        <form className="db-compose" onSubmit={handleAddComment}>
          <input
            placeholder="댓글을 입력하세요"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={commentSending || !commentText.trim()}
          >
            {commentSending ? '…' : '등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
