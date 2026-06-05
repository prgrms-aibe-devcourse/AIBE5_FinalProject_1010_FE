import { useState, useEffect, useCallback } from 'react'
import {
  fetchPosts, fetchPost, createPost, updatePost, deletePost,
  uploadPostAttachment,
} from '../../api/dashboardApi.js'
import { fmtDate, avatarColor } from './courseUtils.js'
import { useAttachments } from './hooks/useAttachments.js'
import AttachmentEditor from './components/AttachmentEditor.jsx'
import PostDetail from './components/PostDetail.jsx'

const EMPTY_FORM = { title: '', content: '' }

export default function BoardTab({ courseId, currentUserId, teacherUserId }) {
  const [view, setView]             = useState('list')  // list | detail | create | edit
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedPost, setSelected] = useState(null)
  const [postForm, setPostForm]     = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]     = useState(null)

  const isTeacher = currentUserId && teacherUserId && currentUserId === teacherUserId
  const attach = useAttachments()

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPosts(courseId)
      setPosts(data.content ?? [])
    } catch {
      setPosts([])
      setApiError('목록을 불러오지 못했습니다. 새로고침해주세요.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { loadList() }, [loadList])

  async function openPost(postId) {
    try {
      const detail = await fetchPost(courseId, postId)
      setSelected(detail)
      setView('detail')
    } catch {
      setApiError('게시글을 불러오지 못했습니다. 다시 시도해주세요.')
    }
  }

  function goList() {
    setView('list')
    setSelected(null)
    setApiError(null)
    loadList()
  }

  function openCreate() {
    setPostForm(EMPTY_FORM)
    attach.reset([])
    setView('create')
  }

  function openEdit() {
    setPostForm({ title: selectedPost.title, content: selectedPost.content })
    attach.reset(selectedPost.attachments ?? [])
    setView('edit')
  }

  async function handlePostSubmit(e) {
    e.preventDefault()
    if (!postForm.title.trim() || !postForm.content.trim()) return
    setSubmitting(true)
    setApiError(null)
    try {
      const attachments = await attach.flushPending(uploadPostAttachment)
      const payload = { ...postForm, attachments }
      if (view === 'edit') {
        const updated = await updatePost(courseId, selectedPost.id, payload)
        setSelected(updated)
        setView('detail')
      } else {
        await createPost(courseId, payload)
        goList()
      }
    } catch {
      if (!attach.uploadError) setApiError('요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm('게시글을 삭제할까요?')) return
    try {
      await deletePost(courseId, postId)
      goList()
    } catch {
      setApiError('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // ── 글 작성 / 수정 폼 ────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="db-block">
        <div className="db-view-header">
          <button
            className="db-back-btn"
            onClick={view === 'edit' ? () => setView('detail') : goList}
          >
            ← {view === 'edit' ? '돌아가기' : '목록'}
          </button>
          <h2>{view === 'edit' ? '✏️ 글 수정' : '✏️ 새 글 작성'}</h2>
        </div>

        {apiError && <p className="db-api-error" role="alert">{apiError}</p>}

        <form className="db-form-body" onSubmit={handlePostSubmit}>
          <div className="form-group">
            <label className="db-form-label">제목</label>
            <input
              className="db-form-input"
              placeholder="제목을 입력하세요"
              value={postForm.title}
              onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="db-form-label">내용</label>
            <textarea
              className="db-form-textarea"
              placeholder="내용을 입력하세요"
              rows={8}
              value={postForm.content}
              onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
              required
            />
          </div>

          <AttachmentEditor
            pendingFiles={attach.pendingFiles}
            uploadedAttachments={attach.uploaded}
            uploading={attach.uploading}
            uploadError={attach.uploadError}
            onAddFiles={attach.addFiles}
            onRemovePending={attach.removePending}
            onRemoveUploaded={attach.removeUploaded}
            fileInputRef={attach.fileInputRef}
          />

          <div className="db-form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={view === 'edit' ? () => setView('detail') : goList}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || attach.uploading}
            >
              {attach.uploading ? '업로드 중…' : submitting ? '저장 중…' : view === 'edit' ? '수정 완료' : '등록'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── 글 상세 ──────────────────────────────────────────────
  if (view === 'detail' && selectedPost) {
    return (
      <PostDetail
        courseId={courseId}
        post={selectedPost}
        currentUserId={currentUserId}
        isTeacher={isTeacher}
        onBack={goList}
        onEdit={openEdit}
        onDeleted={() => handleDeletePost(selectedPost.id)}
      />
    )
  }

  // ── 글 목록 ──────────────────────────────────────────────
  return (
    <div className="db-block">
      <div className="db-block__head">
        <h2>💬 자유 게시판</h2>
        {currentUserId && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>✏️ 글쓰기</button>
        )}
      </div>

      {apiError && <p className="db-api-error" role="alert">{apiError}</p>}

      {loading && <div className="db-loading">게시글을 불러오는 중…</div>}

      {!loading && posts.length === 0 && (
        <div className="db-empty">
          <span className="db-empty__icon">✍️</span>
          <p>아직 게시글이 없습니다. 첫 글을 남겨보세요!</p>
        </div>
      )}

      {!loading && posts.map((p) => (
        <div key={p.id} className="db-thread" onClick={() => openPost(p.id)}>
          <div className="db-thread__title-row">
            <span className="db-thread__title">{p.title}</span>
            {p.attachmentCount > 0 && (
              <span className="db-attach-chip">📎 {p.attachmentCount}</span>
            )}
          </div>
          {p.content && <p className="db-thread__preview">{p.content}</p>}
          <div className="db-thread__foot">
            <div className="db-thread__author">
              <span
                className={`avatar sm ${avatarColor(p.authorId)}`}
                style={{ width: 22, height: 22, fontSize: 9 }}
              >
                {(p.authorName ?? '?')[0]}
              </span>
              <span>{p.authorName}</span>
              <span style={{ color: 'var(--ink-mute)' }}>·</span>
              <span style={{ color: 'var(--ink-mute)' }}>{fmtDate(p.createdAt)}</span>
            </div>
            <div className="db-thread__stats">
              <span title="조회">👁 {p.viewCount}</span>
              <span title="댓글">💬 {p.commentCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
