import { useEffect, useMemo, useState } from 'react'
import { fetchSubjects } from '../../../api/subjectApi.js'
import {
  createWrongAnswerNote,
  deleteWrongAnswerNote,
  fetchWrongAnswerNote,
  fetchWrongAnswerNotes,
  updateWrongAnswerNote,
} from '../../../api/wrongAnswerNoteApi.js'

import useNotice from '../../../hooks/useNotice.js'
import { subjectNameOf } from './wrongnote/noteUtils.jsx'
import NoteForm from './wrongnote/NoteForm.jsx'
import PracticeMode from './wrongnote/PracticeMode.jsx'
import NoteCard from './wrongnote/NoteCard.jsx'
import NoteDetail from './wrongnote/NoteDetail.jsx'

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
  
  // useNotice 커스텀 훅 적용 (3.5초 뒤 자동 소멸)
  const [notice, showNotice] = useNotice(3500)
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
      showNotice('오답노트를 작성했습니다.')
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
      showNotice('오답노트를 수정했습니다.')
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
      showNotice('오답노트를 삭제했습니다.')
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
        <div className="wan-hero-actions">
          <button className="wan-btn wan-btn--ghost" onClick={() => { setMode('practice'); setConfirmDelete(false) }}>
            문제풀기
          </button>
          <button className="wan-btn wan-btn--primary" onClick={() => { setMode('create'); setConfirmDelete(false) }}>
            + 새 오답노트
          </button>
        </div>
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

      <div className="wan-layout">
        <aside className="wan-list-pane">
          <div className="wan-list-meta">
            <span>총 {totalElements}개의 기록</span>
          </div>

          <div className="wan-list">
            {loading ? (
              <div className="mp-loading">오답노트를 불러오는 중...</div>
            ) : notes.length > 0 ? (
              notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  active={mode !== 'practice' && selectedNote?.id === note.id}
                  onClick={() => handleSelect(note)}
                />
              ))
            ) : (
              <div className="mp-empty">
                <p className="mp-empty__text">조건에 맞는 오답노트가 없습니다.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="wan-pagination">
              {pageNumbers.map(num => (
                <button
                  key={num}
                  className={num === page ? 'is-active' : ''}
                  onClick={() => setPage(num)}
                  disabled={loading}
                >
                  {num + 1}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="wan-content-pane">
          {mode === 'create' && (
            <NoteForm
              subjects={subjects}
              initialValue={{ subjectId: selectedSubjectId }}
              saving={saving}
              onCancel={() => setMode('detail')}
              onSubmit={handleCreate}
              mode="create"
            />
          )}

          {mode === 'edit' && selectedNote && (
            <NoteForm
              subjects={subjects}
              initialValue={selectedNote}
              saving={saving}
              onCancel={() => setMode('detail')}
              onSubmit={handleUpdate}
              mode="edit"
            />
          )}

          {mode === 'practice' && (
            <PracticeMode
              subjects={subjects}
              defaultSubjectId={selectedSubjectId}
              onClose={() => setMode('detail')}
              onPracticeChanged={() => setRefreshKey(key => key + 1)}
            />
          )}

          {mode === 'detail' && (
            detailLoading ? (
              <div className="mp-loading">상세 내용을 불러오는 중...</div>
            ) : (
              <NoteDetail
                note={selectedNote}
                deleting={deleting}
                confirmDelete={confirmDelete}
                onEdit={() => setMode('edit')}
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
