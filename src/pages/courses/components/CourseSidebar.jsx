import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABELS } from '../courseUtils.js'
import { toAbsoluteFileUrl } from '../../../api/fileApi.js'
import { updateNextClass } from '../../../api/dashboardApi.js'
import { IcCalendar, IcBarChart, IcGraduationCap } from './DashboardIcons.jsx'

function useCountdown(target) {
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    if (!target) { setDiff(null); return }
    const tick = () => {
      const ms = new Date(target) - Date.now()
      setDiff(ms)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (diff === null) return null
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true }
  const s = Math.floor(diff / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    passed: false,
  }
}

function toLocalInputValue(isoString) {
  if (!isoString) return ''
  // ISO → datetime-local input 형식 (YYYY-MM-DDTHH:mm)
  return isoString.slice(0, 16)
}

function toIsoLocal(localValue) {
  // datetime-local → ISO 8601 (서버는 LocalDateTime 직렬화로 받음)
  return localValue ? localValue + ':00' : null
}

export default function CourseSidebar({ dashboard, courseId, isTeacher, onDashboardUpdate }) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving] = useState(false)

  const countdown = useCountdown(dashboard.nextClassAt)

  const ringPercent = dashboard.maxStudents > 0
    ? Math.round((dashboard.enrolledCount / dashboard.maxStudents) * 100)
    : 0
  const modeLabel = dashboard.maxStudents === 1 ? '1:1' : `그룹 (최대 ${dashboard.maxStudents}명)`

  const startEdit = useCallback(() => {
    setInputVal(toLocalInputValue(dashboard.nextClassAt))
    setEditing(true)
  }, [dashboard.nextClassAt])

  const cancelEdit = () => setEditing(false)

  const saveNextClass = async () => {
    setSaving(true)
    try {
      const updated = await updateNextClass(courseId, toIsoLocal(inputVal))
      onDashboardUpdate?.(updated)
      setEditing(false)
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside className="db-info">

      {/* 다음 수업 일정 */}
      <div className="db-info-card">
        <div className="db-info-card__head">
          <h3><IcCalendar /> 다음 수업</h3>
          {isTeacher && !editing && (
            <button className="db-edit-tiny" onClick={startEdit}>편집</button>
          )}
        </div>

        {editing ? (
          <div className="db-next-edit">
            <input
              type="datetime-local"
              className="db-next-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <div className="db-next-edit__btns">
              <button className="btn btn--primary btn--sm" onClick={saveNextClass} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={cancelEdit} disabled={saving}>취소</button>
            </div>
          </div>
        ) : dashboard.nextClassAt ? (
          countdown?.passed ? (
            <p className="db-next-passed">수업이 시작되었습니다</p>
          ) : countdown ? (
            <div className="db-countdown">
              <div className="db-countdown__item"><b>{countdown.days}</b><small>일</small></div>
              <div className="db-countdown__sep">:</div>
              <div className="db-countdown__item"><b>{String(countdown.hours).padStart(2,'0')}</b><small>시간</small></div>
              <div className="db-countdown__sep">:</div>
              <div className="db-countdown__item"><b>{String(countdown.minutes).padStart(2,'0')}</b><small>분</small></div>
              <div className="db-countdown__sep">:</div>
              <div className="db-countdown__item"><b>{String(countdown.seconds).padStart(2,'0')}</b><small>초</small></div>
            </div>
          ) : null
        ) : (
          <p className="db-next-empty">
            {isTeacher ? '편집 버튼을 눌러 다음 수업 일시를 설정하세요.' : '아직 다음 수업 일정이 없습니다.'}
          </p>
        )}

        {dashboard.nextClassAt && !editing && (
          <p className="db-next-date">
            {new Date(dashboard.nextClassAt).toLocaleString('ko-KR', {
              month: 'long', day: 'numeric', weekday: 'short',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* 수강 현황 */}
      <div className="db-info-card">
        <h3><IcBarChart /> 수강 현황</h3>
        <div className="db-ring-wrap">
          <div className="db-ring" style={{ '--ring-p': ringPercent }}>
            <div className="db-ring__text">
              <b>{dashboard.enrolledCount}</b>
              <small>/ {dashboard.maxStudents}명</small>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-mute)' }}>
            {ringPercent}% 수강 중
          </span>
        </div>
        <div className="db-info-row">
          <span>상태</span>
          <span>{STATUS_LABELS[dashboard.status] ?? dashboard.status}</span>
        </div>
        <div className="db-info-row">
          <span>수강 인원</span>
          <span>{dashboard.enrolledCount} / {dashboard.maxStudents}명</span>
        </div>
        <div className="db-info-row">
          <span>수업 형태</span>
          <span>{modeLabel}</span>
        </div>
      </div>

      {/* 담당 선생님 */}
      <div className="db-info-card">
        <h3><IcGraduationCap /> 담당 선생님</h3>
        <div className="db-teacher-mini">
          <span className="avatar md c1" style={{ flexShrink: 0 }}>
            {dashboard.teacherProfileImageUrl ? (
              <img
                src={toAbsoluteFileUrl(dashboard.teacherProfileImageUrl)}
                alt={dashboard.teacherName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              (dashboard.teacherName ?? '?')[0]
            )}
          </span>
          <div className="db-teacher-mini__info">
            <div className="db-teacher-mini__name">{dashboard.teacherName}</div>
            {dashboard.teacherEducation && (
              <div className="db-teacher-mini__sub">{dashboard.teacherEducation}</div>
            )}
            <div className="db-teacher-mini__sub">
              내공 {dashboard.teacherNaegongScore?.toLocaleString() ?? 0}점
            </div>
          </div>
        </div>
        <Link
          to={`/teachers/${dashboard.teacherProfileId}`}
          className="btn btn-secondary btn-sm btn-full"
        >
          선생님 프로필 보기
        </Link>
      </div>

    </aside>
  )
}
