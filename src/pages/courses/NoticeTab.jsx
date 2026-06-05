import { useState, useEffect, useCallback } from 'react'
import {
  fetchNotices, createNotice, updateNotice, deleteNotice,
  uploadNoticeAttachment,
} from '../../api/dashboardApi.js'
import { useAttachments } from './hooks/useAttachments.js'
import AttachmentEditor from './components/AttachmentEditor.jsx'
import NoticeItem from './components/NoticeItem.jsx'

const EMPTY_FORM = { title: '', content: '', important: false }

export default function NoticeTab({ courseId, isTeacher }) {
  const [view, setView]             = useState('list')  // 'list' | 'form'
  const [editing, setEditing]       = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [notices, setNotices]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]     = useState(null)

  const attach = useAttachments()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotices(courseId)
      setNotices(data.content ?? [])
    } catch {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    attach.reset([])
    setView('form')
  }

  function openEdit(notice) {
    setEditing(notice)
    setForm({ title: notice.title, content: notice.content, important: notice.important })
    attach.reset(notice.attachments ?? [])
    setView('form')
  }

  function cancelForm() {
    setView('list')
    setEditing(null)
    setForm(EMPTY_FORM)
    attach.reset([])
    setApiError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setSubmitting(true)
    setApiError(null)
    try {
      const attachments = await attach.flushPending(uploadNoticeAttachment)
      const payload = { ...form, attachments }
      if (editing) {
        await updateNotice(courseId, editing.id, payload)
      } else {
        await createNotice(courseId, payload)
      }
      cancelForm()
      await load()
    } catch {
      if (!attach.uploadError) setApiError('요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(noticeId) {
    if (!window.confirm('공지사항을 삭제할까요?')) return
    try {
      await deleteNotice(courseId, noticeId)
      setExpandedId(null)
      await load()
    } catch {
      setApiError('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // ── 폼 뷰 ────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="db-block">
        <div className="db-view-header">
          <button className="db-back-btn" onClick={cancelForm}>← 목록</button>
          <h2>{editing ? '✏️ 공지 수정' : '📢 새 공지 작성'}</h2>
        </div>

        {apiError && (
          <p className="db-api-error" role="alert">{apiError}</p>
        )}

        <form className="db-form-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="db-form-label">제목</label>
            <input
              className="db-form-input"
              placeholder="공지 제목을 입력하세요"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="db-form-label">내용</label>
            <textarea
              className="db-form-textarea"
              placeholder="공지 내용을 입력하세요"
              rows={6}
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
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

          <label className="db-form-check">
            <input
              type="checkbox"
              checked={form.important}
              onChange={(e) => setForm((p) => ({ ...p, important: e.target.checked }))}
            />
            중요 공지로 설정
          </label>

          <div className="db-form-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelForm}>취소</button>
            <button
              type="submit"
              className="btn btn-coral btn-sm"
              disabled={submitting || attach.uploading}
            >
              {attach.uploading ? '업로드 중…' : submitting ? '저장 중…' : editing ? '수정 완료' : '공지 등록'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── 목록 뷰 ──────────────────────────────────────────────
  return (
    <div className="db-block">
      <div className="db-block__head">
        <h2>📢 공지사항</h2>
        {isTeacher && (
          <button className="btn btn-coral btn-sm" onClick={openCreate}>+ 공지 작성</button>
        )}
      </div>

      {apiError && <p className="db-api-error" role="alert">{apiError}</p>}

      {loading && <div className="db-loading">공지사항을 불러오는 중…</div>}

      {!loading && notices.length === 0 && (
        <div className="db-empty">
          <span className="db-empty__icon">📭</span>
          <p>등록된 공지사항이 없습니다.</p>
        </div>
      )}

      {!loading && notices.map((n) => (
        <NoticeItem
          key={n.id}
          notice={n}
          isTeacher={isTeacher}
          isExpanded={expandedId === n.id}
          onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
          onEdit={() => openEdit(n)}
          onDelete={() => handleDelete(n.id)}
        />
      ))}
    </div>
  )
}
