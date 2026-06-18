import { useState, useEffect, useCallback } from 'react'
import {
  fetchCourseProgress, createCourseProgress, updateCourseProgress, deleteCourseProgress,
} from '../../api/courseProgressApi.js'
import { IcBarChart, IcPencil, IcInbox } from './components/DashboardIcons.jsx'

// 'YYYY-MM-DD' (오늘) — input[type=date] 기본값/폼 초기값
function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// 'YYYY-MM-DD' → '2026.06.18 (목)'
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day} (${WEEKDAYS[d.getDay()]})`
}

const emptyForm = () => ({ content: '', progressDate: todayStr() })

/**
 * 수업 진도 현황 탭 — 진도(날짜 + 짤막한 내용)를 타임라인으로 보여준다.
 * 조회는 멤버 누구나, 작성/수정/삭제는 담당 선생님만(isTeacher). (이슈 #108 / BE #173)
 */
export default function ProgressTab({ courseId, isTeacher }) {
  const [view, setView]             = useState('list') // 'list' | 'form'
  const [editing, setEditing]       = useState(null)
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]     = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchCourseProgress(courseId, { size: 100 })
      setItems(data.content ?? [])
    } catch {
      setItems([])
      setApiError('진도를 불러오지 못했습니다. 새로고침해주세요.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setApiError(null)
    setView('form')
  }

  function openEdit(p) {
    setEditing(p)
    setForm({ content: p.content, progressDate: p.progressDate })
    setApiError(null)
    setView('form')
  }

  function cancelForm() {
    setView('list')
    setEditing(null)
    setForm(emptyForm())
    setApiError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.content.trim()) return
    setSubmitting(true)
    setApiError(null)
    try {
      const payload = { content: form.content.trim(), progressDate: form.progressDate || undefined }
      if (editing) await updateCourseProgress(courseId, editing.id, payload)
      else await createCourseProgress(courseId, payload)
      await load()
      cancelForm()
    } catch {
      setApiError('요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('이 진도 기록을 삭제할까요?')) return
    try {
      await deleteCourseProgress(courseId, id)
      setExpandedId(null)
      await load()
    } catch {
      setApiError('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // ── 폼 뷰(선생님) ─────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="db-block prog-fade">
        <div className="db-view-header">
          <button className="db-back-btn" onClick={cancelForm}>← 목록</button>
          <h2>{editing ? <><IcPencil /> 진도 수정</> : <><IcBarChart /> 진도 추가</>}</h2>
        </div>

        {apiError && <p className="db-api-error" role="alert">{apiError}</p>}

        <form className="db-form-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="db-form-label">날짜</label>
            <input
              type="date"
              className="db-form-input"
              value={form.progressDate}
              max={todayStr()}
              onChange={(e) => setForm((p) => ({ ...p, progressDate: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="db-form-label">진도 내용</label>
            <textarea
              className="db-form-textarea"
              rows={4}
              maxLength={1000}
              placeholder="오늘 어디까지 나갔는지 짧게 적어주세요 (예: 3단원 함수 ~ 합성함수까지)"
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              required
            />
            <span className="prog-counter">{form.content.length}/1000</span>
          </div>

          <div className="db-form-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelForm}>취소</button>
            <button type="submit" className="btn btn-coral btn-sm" disabled={submitting}>
              {submitting ? '저장 중…' : editing ? '수정 완료' : '진도 등록'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── 목록 뷰 ──────────────────────────────────────────────
  return (
    <div className="db-block prog-fade">
      <div className="db-block__head">
        <h2><IcBarChart /> 수업 진도 현황</h2>
        {isTeacher && (
          <button className="btn btn-coral btn-sm" onClick={openCreate}>+ 진도 추가</button>
        )}
      </div>

      {apiError && <p className="db-api-error" role="alert">{apiError}</p>}

      {loading && <div className="db-loading">진도를 불러오는 중…</div>}

      {!loading && items.length === 0 && (
        <div className="db-empty">
          <span className="db-empty__icon"><IcInbox /></span>
          <p>아직 기록된 수업 진도가 없습니다.</p>
          {isTeacher && <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>“진도 추가”로 오늘 나간 진도를 남겨보세요.</p>}
        </div>
      )}

      {!loading && items.length > 0 && (
        <ol className="prog-timeline">
          {items.map((p, i) => {
            const expanded = expandedId === p.id
            return (
              <li
                key={p.id}
                className="prog-item"
                style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}
              >
                <span className={`prog-item__dot${i === 0 ? ' prog-item__dot--latest' : ''}`} aria-hidden="true" />
                <div className="prog-item__card">
                  <div className="prog-item__head">
                    <span className="prog-item__date">{fmtDate(p.progressDate)}</span>
                    {isTeacher && (
                      <span className="prog-item__actions">
                        <button className="prog-icon-btn" title="수정" onClick={() => openEdit(p)}>
                          <IcPencil size={14} />
                        </button>
                        <button className="prog-icon-btn prog-icon-btn--danger" title="삭제" onClick={() => handleDelete(p.id)}>
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                  <p
                    className={`prog-item__content${expanded ? ' is-expanded' : ''}`}
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    title="클릭하면 펼치기/접기"
                  >
                    {p.content}
                  </p>
                  <span className="prog-item__meta">{p.authorName}</span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
