import { useEffect, useMemo, useState } from 'react'
import { fetchSubjects } from '../../../api/subjectApi.js'
import {
  createWrongAnswerNote,
  deleteWrongAnswerNote,
  fetchWrongAnswerNote,
  fetchWrongAnswerNotes,
  updateWrongAnswerNote,
} from '../../../api/wrongAnswerNoteApi.js'
import { toAbsoluteFileUrl } from '../../../api/fileApi.js'

const EMPTY_FORM = {
  subjectId: '',
  title: '',
  questionContent: '',
  answerContent: '',
  wrongReason: '',
  explanation: '',
  memo: '',
  tagsText: '',
}

const SOURCE_LABEL = {
  DIRECT: '직접 작성',
  QNA: '질문게시판',
  AI: 'AI 질문',
}

function toForm(note) {
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

function toPayload(form) {
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

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function stripImageMarkdown(text) {
  return (text ?? '').replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
}

function renderNoteContent(text) {
  if (!text) return null

  const parts = []
  const imagePattern = /!\[([^\]]*)]\(([^)]+)\)/g
  let cursor = 0
  let match

  while ((match = imagePattern.exec(text)) !== null) {
    const before = text.slice(cursor, match.index).trim()
    if (before) parts.push({ type: 'text', value: before })
    parts.push({ type: 'image', alt: match[1] || '오답노트 첨부 이미지', url: match[2] })
    cursor = match.index + match[0].length
  }

  const rest = text.slice(cursor).trim()
  if (rest) parts.push({ type: 'text', value: rest })

  return parts.map((part, index) => (
    part.type === 'image'
      ? <img key={`img-${index}`} className="wan-content-image" src={toAbsoluteFileUrl(part.url)} alt={part.alt} />
      : <p key={`text-${index}`}>{part.value}</p>
  ))
}

function subjectNameOf(subjects, subjectId) {
  const found = subjects.find(subject => String(subject.subjectId) === String(subjectId))
  return found?.name ?? '과목 없음'
}

function NoteForm({ subjects, initialValue, saving, onCancel, onSubmit, mode }) {
  const [form, setForm] = useState(() => toForm(initialValue))

  useEffect(() => {
    setForm(toForm(initialValue))
  }, [initialValue])

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(toPayload(form))
  }

  const canSubmit = form.title.trim() && form.questionContent.trim()

  return (
    <form className="wan-form" onSubmit={handleSubmit}>
      <div className="wan-form-head">
        <div>
          <p className="wan-kicker">{mode === 'edit' ? '오답노트 수정' : '새 오답노트'}</p>
          <h3>{mode === 'edit' ? '기록을 다듬어 저장하기' : '틀린 문제를 바로 정리하기'}</h3>
        </div>
        <button type="button" className="wan-icon-btn" onClick={onCancel} aria-label="닫기">
          ×
        </button>
      </div>

      <div className="wan-form-grid">
        <label className="wan-field wan-field--full">
          <span>제목</span>
          <input
            value={form.title}
            onChange={event => updateField('title', event.target.value)}
            placeholder="예: 등차수열 점화식 실수"
            maxLength={200}
            required
          />
        </label>

        <label className="wan-field">
          <span>과목</span>
          <select value={form.subjectId} onChange={event => updateField('subjectId', event.target.value)}>
            <option value="">과목 선택 안 함</option>
            {subjects.map(subject => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="wan-field">
          <span>태그</span>
          <input
            value={form.tagsText}
            onChange={event => updateField('tagsText', event.target.value)}
            placeholder="쉼표로 구분"
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>문제 내용</span>
          <textarea
            value={form.questionContent}
            onChange={event => updateField('questionContent', event.target.value)}
            placeholder="문제, 조건, 내가 헷갈린 지점을 적어주세요."
            required
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>정답 / 풀이</span>
          <textarea
            value={form.answerContent}
            onChange={event => updateField('answerContent', event.target.value)}
            placeholder="정답이나 선생님/AI 답변을 정리해두세요."
          />
        </label>

        <label className="wan-field">
          <span>틀린 이유</span>
          <textarea
            value={form.wrongReason}
            onChange={event => updateField('wrongReason', event.target.value)}
            placeholder="계산 실수, 개념 착각, 조건 누락 등"
          />
        </label>

        <label className="wan-field">
          <span>다음 풀이 전략</span>
          <textarea
            value={form.explanation}
            onChange={event => updateField('explanation', event.target.value)}
            placeholder="다음에 같은 유형을 만나면 어떻게 풀지"
          />
        </label>

        <label className="wan-field wan-field--full">
          <span>메모</span>
          <textarea
            value={form.memo}
            onChange={event => updateField('memo', event.target.value)}
            placeholder="복습 일정이나 추가로 기억할 내용을 적어두세요."
          />
        </label>
      </div>

      <div className="wan-form-actions">
        <button type="button" className="wan-btn wan-btn--ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="wan-btn wan-btn--primary" disabled={!canSubmit || saving}>
          {saving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '작성 완료'}
        </button>
      </div>
    </form>
  )
}

function NoteCard({ note, active, onClick }) {
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

function NoteDetail({ note, deleting, confirmDelete, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }) {
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
        {renderNoteContent(note.questionContent)}
      </div>
      {note.answerContent && (
        <div className="wan-detail-section">
          <span>정답 / 풀이</span>
          {renderNoteContent(note.answerContent)}
        </div>
      )}
      {note.wrongReason && (
        <div className="wan-detail-section">
          <span>틀린 이유</span>
          {renderNoteContent(note.wrongReason)}
        </div>
      )}
      {note.explanation && (
        <div className="wan-detail-section">
          <span>다음 풀이 전략</span>
          {renderNoteContent(note.explanation)}
        </div>
      )}
      {note.memo && (
        <div className="wan-detail-section">
          <span>메모</span>
          {renderNoteContent(note.memo)}
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

export default function WrongAnswerNoteTab() {
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mode, setMode] = useState('detail')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')

    fetchWrongAnswerNotes({
      subjectId: selectedSubjectId ? Number(selectedSubjectId) : null,
      keyword,
      page,
      size: 8,
    })
      .then(data => {
        if (ignore) return
        const content = data.content ?? []
        setNotes(content)
        setTotalPages(data.totalPages ?? 0)
        setTotalElements(data.totalElements ?? content.length)
        if (!selectedNote && content.length > 0 && mode === 'detail') {
          setSelectedNote(content[0])
        }
      })
      .catch(err => {
        if (!ignore) setError(err.message || '오답노트를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedSubjectId, keyword, page, refreshKey])

  const selectedSubjectName = useMemo(
    () => (selectedSubjectId ? subjectNameOf(subjects, selectedSubjectId) : '전체 과목'),
    [subjects, selectedSubjectId],
  )

  function handleSearchSubmit(event) {
    event.preventDefault()
    setKeyword(keywordInput.trim())
    setPage(0)
  }

  function handleSubjectChange(value) {
    setSelectedSubjectId(value)
    setPage(0)
    setSelectedNote(null)
    setMode('detail')
  }

  async function handleSelect(note) {
    setMode('detail')
    setConfirmDelete(false)
    setDetailLoading(true)
    try {
      setSelectedNote(await fetchWrongAnswerNote(note.id))
    } catch (err) {
      setError(err.message || '오답노트를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleCreate(payload) {
    setSaving(true)
    setError('')
    try {
      const created = await createWrongAnswerNote(payload)
      setNotice('오답노트를 작성했습니다.')
      setSelectedNote(created)
      setMode('detail')
      setPage(0)
      setRefreshKey(key => key + 1)
    } catch (err) {
      setError(err.message || '오답노트 작성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(payload) {
    if (!selectedNote) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateWrongAnswerNote(selectedNote.id, payload)
      setNotice('오답노트를 수정했습니다.')
      setSelectedNote(updated)
      setMode('detail')
      setRefreshKey(key => key + 1)
    } catch (err) {
      setError(err.message || '오답노트 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedNote) return
    setDeleting(true)
    setError('')
    try {
      await deleteWrongAnswerNote(selectedNote.id)
      setNotice('오답노트를 삭제했습니다.')
      setSelectedNote(null)
      setConfirmDelete(false)
      setMode('detail')
      setRefreshKey(key => key + 1)
    } catch (err) {
      setError(err.message || '오답노트 삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index)

  return (
    <div className="mp-block wan-block">
      <div className="wan-hero">
        <div>
          <p className="wan-kicker">Wrong Answer Notes</p>
          <h2>오답노트</h2>
          <p>질문게시판과 AI 질문에서 옮긴 기록도, 직접 작성한 기록도 과목별로 모아 복습하세요.</p>
        </div>
        <button className="wan-btn wan-btn--primary" onClick={() => { setMode('create'); setConfirmDelete(false) }}>
          + 새 오답노트
        </button>
      </div>

      {notice && <p className="mp-feedback mp-feedback--success">{notice}</p>}
      {error && <p className="mp-feedback mp-feedback--error">{error}</p>}

      <div className="wan-tools">
        <form className="wan-search" onSubmit={handleSearchSubmit}>
          <input
            value={keywordInput}
            onChange={event => setKeywordInput(event.target.value)}
            placeholder="제목, 문제, 풀이, 태그 검색"
          />
          <button type="submit">검색</button>
        </form>

        <select
          className="wan-subject-select"
          value={selectedSubjectId}
          onChange={event => handleSubjectChange(event.target.value)}
        >
          <option value="">전체 과목</option>
          {subjects.map(subject => (
            <option key={subject.subjectId} value={subject.subjectId}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="wan-subject-pills">
        <button className={!selectedSubjectId ? 'active' : ''} onClick={() => handleSubjectChange('')}>
          전체
        </button>
        {subjects.map(subject => (
          <button
            key={subject.subjectId}
            className={String(selectedSubjectId) === String(subject.subjectId) ? 'active' : ''}
            onClick={() => handleSubjectChange(String(subject.subjectId))}
          >
            {subject.name}
          </button>
        ))}
      </div>

      <div className="wan-summary">
        <span>{selectedSubjectName}</span>
        <strong>{totalElements.toLocaleString()}개 기록</strong>
        {keyword && <em>검색어: {keyword}</em>}
      </div>

      <div className="wan-layout">
        <section className="wan-list-panel">
          {loading && <div className="mp-loading">오답노트를 불러오는 중...</div>}
          {!loading && notes.length === 0 && (
            <div className="mp-empty">
              <p className="mp-empty__text">아직 작성된 오답노트가 없습니다.</p>
            </div>
          )}
          {!loading && notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              active={selectedNote?.id === note.id && mode === 'detail'}
              onClick={() => handleSelect(note)}
            />
          ))}

          {totalPages > 1 && (
            <div className="wan-pages">
              {pageNumbers.map(pageNumber => (
                <button
                  key={pageNumber}
                  className={page === pageNumber ? 'active' : ''}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber + 1}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="wan-main-panel">
          {mode === 'create' && (
            <NoteForm
              subjects={subjects}
              initialValue={EMPTY_FORM}
              saving={saving}
              mode="create"
              onCancel={() => setMode('detail')}
              onSubmit={handleCreate}
            />
          )}
          {mode === 'edit' && selectedNote && (
            <NoteForm
              subjects={subjects}
              initialValue={selectedNote}
              saving={saving}
              mode="edit"
              onCancel={() => setMode('detail')}
              onSubmit={handleUpdate}
            />
          )}
          {mode === 'detail' && (
            detailLoading
              ? <div className="mp-loading">상세 내용을 불러오는 중...</div>
              : (
                <NoteDetail
                  note={selectedNote}
                  deleting={deleting}
                  confirmDelete={confirmDelete}
                  onEdit={() => selectedNote && setMode('edit')}
                  onAskDelete={() => setConfirmDelete(true)}
                  onCancelDelete={() => setConfirmDelete(false)}
                  onConfirmDelete={handleDelete}
                />
              )
          )}
        </section>
      </div>
    </div>
  )
}
