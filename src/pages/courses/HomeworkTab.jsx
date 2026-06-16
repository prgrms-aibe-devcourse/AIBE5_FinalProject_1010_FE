import { useState, useEffect, useCallback } from 'react'
import {
  fetchAssignments, createAssignment, updateAssignment, deleteAssignment,
} from '../../api/dashboardApi.js'
import { IcClipboard, IcInbox, IcPencil } from './components/DashboardIcons.jsx'

const EMPTY_FORM = { title: '', content: '', dueDate: '' }

function fmtDue(isoString) {
  if (!isoString) return null
  const d = new Date(isoString)
  const passed = d < new Date()
  return {
    text: d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    passed,
  }
}

function AssignmentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { alert('과제 제목을 입력해주세요.'); return }
    setSaving(true)
    try { await onSave(form) }
    catch { alert('저장에 실패했습니다.') }
    finally { setSaving(false) }
  }

  return (
    <div className="hw-form">
      <input
        className="db-form-input"
        placeholder="과제 제목 *"
        value={form.title}
        onChange={e => set('title', e.target.value)}
      />
      <textarea
        className="db-form-textarea"
        placeholder="과제 설명 (선택)"
        value={form.content}
        onChange={e => set('content', e.target.value)}
        rows={4}
      />
      <div className="hw-form__due">
        <label className="db-form-label">마감일 (선택)</label>
        <input
          type="datetime-local"
          className="db-next-input"
          value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)}
        />
      </div>
      <div className="db-form-actions">
        <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={saving}>취소</button>
      </div>
    </div>
  )
}

export default function HomeworkTab({ courseId, isTeacher }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAssignments(courseId)
      setAssignments(Array.isArray(data) ? data : [])
    } catch { setAssignments([]) }
    finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    await createAssignment(courseId, {
      title: form.title,
      content: form.content || null,
      dueDate: form.dueDate ? form.dueDate + ':00' : null,
    })
    setShowForm(false)
    await load()
  }

  const handleUpdate = async (form, id) => {
    await updateAssignment(courseId, id, {
      title: form.title,
      content: form.content || null,
      dueDate: form.dueDate ? form.dueDate + ':00' : null,
    })
    setEditingId(null)
    await load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('과제를 삭제할까요?')) return
    await deleteAssignment(courseId, id)
    await load()
  }

  return (
    <div className="db-block">
      <div className="db-block__head">
        <h2><IcClipboard /> 과제</h2>
        {isTeacher && !showForm && (
          <button className="btn btn-coral btn-sm" onClick={() => setShowForm(true)}>
            <IcPencil size={14} /> 과제 추가
          </button>
        )}
      </div>

      {isTeacher && showForm && (
        <AssignmentForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {loading && <div className="db-loading">과제 목록을 불러오는 중…</div>}

      {!loading && assignments.length === 0 && !showForm && (
        <div className="db-empty">
          <span className="db-empty__icon"><IcInbox /></span>
          <p>{isTeacher ? '과제 추가 버튼으로 첫 과제를 등록하세요.' : '등록된 과제가 없습니다.'}</p>
        </div>
      )}

      <ul className="hw-list">
        {assignments.map(a => {
          const due = fmtDue(a.dueDate)
          const isEditing = editingId === a.id

          return (
            <li key={a.id} className="hw-item">
              {isEditing ? (
                <AssignmentForm
                  initial={{
                    title: a.title,
                    content: a.content ?? '',
                    dueDate: a.dueDate ? a.dueDate.slice(0, 16) : '',
                  }}
                  onSave={form => handleUpdate(form, a.id)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="hw-item__head">
                    <span className="hw-item__title">{a.title}</span>
                    {isTeacher && (
                      <div className="hw-item__actions">
                        <button className="db-edit-tiny" onClick={() => setEditingId(a.id)}>수정</button>
                        <button className="db-edit-tiny db-edit-tiny--danger" onClick={() => handleDelete(a.id)}>삭제</button>
                      </div>
                    )}
                  </div>
                  {a.content && <p className="hw-item__content">{a.content}</p>}
                  {due && (
                    <span className={`hw-item__due${due.passed ? ' hw-item__due--passed' : ''}`}>
                      마감: {due.text}{due.passed ? ' (마감됨)' : ''}
                    </span>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
