/**
 * @file ClassroomLauncher.jsx
 * @description 메인 화면의 "강의실 열기" 플로팅 버튼 (이슈 #97).
 * - 선생님(담당 교사)으로 로그인했을 때만 보인다.
 * - 클릭하면 모달에 진행 중인 내 수업 목록을 보여준다.
 * - 수업을 선택하면 그 강의실을 "새 창"으로 연다(window.open). 같은 강의실은 같은 창으로 재사용(focus).
 */
import { useState, useCallback, useEffect } from 'react'
import { authFetch } from '../../api/authFetch.js'
import { API_BASE } from '../../api/config.js'
import { hasAccessToken } from '../../auth/tokenStore.js'
import { getCurrentUserRole } from '../../auth/currentUser.js'
import { openClassroomInNewTab } from '../../utils/classroomWindow.js'
import '../../styles/classroom-launcher.css'

export default function ClassroomLauncher() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [error, setError]     = useState(false)

  const role = getCurrentUserRole()
  const isTeacher = role === 'TEACHER' || role === 'ADMIN'

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      // 진행 중인 내 수업(선생님 전용)
      const res = await authFetch(`${API_BASE}/api/v1/teachers/me/courses?status=RECRUITING&size=100`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = (data.content ?? []).map((c) => ({
        courseId: c.id,
        title: c.title,
        subjectName: c.subjectName,
        teacherName: c.teacherName,
        thumbnailUrl: c.thumbnailUrl,
      }))
      setCourses(list)
    } catch {
      setError(true); setCourses([])
    } finally {
      setLoading(false)
    }
  }, [])

  const openModal = () => { setOpen(true); load() }
  const pick = (courseId) => { openClassroomInNewTab(courseId); setOpen(false) }

  // 모달 ESC로 닫기 — 키보드 접근성
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // 선생님으로 로그인한 경우에만 노출
  if (!hasAccessToken() || !isTeacher) return null

  return (
    <>
      <button type="button" className="cl-fab" onClick={openModal} title="강의실 열기">
        <span className="cl-fab__ic" aria-hidden="true">🎥</span>
        <span className="cl-fab__label">강의실 열기</span>
      </button>

      {open && (
        <div className="cl-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal__head">
              <h3>🎥 강의실 열기</h3>
              <button type="button" className="cl-close" onClick={() => setOpen(false)} aria-label="닫기">✕</button>
            </div>
            <p className="cl-sub">
              진행 중인 수업 중 하나를 선택하면 <b>새 창</b>으로 강의실이 열려요.
            </p>

            {loading && <div className="cl-state">불러오는 중…</div>}
            {!loading && error && <div className="cl-state">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>}
            {!loading && !error && courses.length === 0 && (
              <div className="cl-state">진행 중인 수업이 없어요.</div>
            )}
            {!loading && !error && courses.length > 0 && (
              <ul className="cl-list">
                {courses.map((c, i) => (
                  <li key={c.courseId} className="cl-item" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                    <button type="button" className="cl-item__btn" onClick={() => pick(c.courseId)}>
                      <span className="cl-thumb">
                        {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" /> : <span className="cl-thumb__txt">{c.subjectName || '📚'}</span>}
                      </span>
                      <span className="cl-info">
                        <span className="cl-title">{c.title}</span>
                        <span className="cl-meta">
                          {[c.subjectName, c.teacherName && `${c.teacherName} 선생님`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="cl-go">열기 →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
