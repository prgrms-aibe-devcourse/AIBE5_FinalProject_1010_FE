import { useNavigate } from 'react-router-dom'
import { getAccessToken } from '../../../auth/tokenStore.js'
import { IcVideo } from './DashboardIcons.jsx'

const STATUS_LABEL = {
  RECRUITING: '모집 중',
  ACTIVE:     '진행 중',
  COMPLETED:  '완료',
  CLOSED:     '종료',
}

// dashboard 객체(대시보드 페이지) 또는 개별 props(상세 페이지) 모두 지원
export default function CourseHero({
  dashboard, courseId,
  title, subjectName, gradeLabel, durationMinutes,
}) {
  const navigate = useNavigate()

  const _title           = dashboard?.title           ?? title
  const _subjectName     = dashboard?.subjectName     ?? subjectName
  const _gradeLabel      = dashboard?.gradeLabel      ?? gradeLabel
  const _durationMinutes = dashboard?.durationMinutes ?? durationMinutes
  const _status          = dashboard?.status

  const showClassroomBtn = !!getAccessToken() && !!courseId && !!dashboard

  return (
    <div className="db-hero">
      <div className="db-hero__info">
        <div className="db-hero__chips">
          {_subjectName && <span className="db-chip subject">{_subjectName}</span>}
          {_gradeLabel  && <span className="db-chip grade">{_gradeLabel}</span>}
          {_status      && (
            <span className={`db-chip status-${_status.toLowerCase()}`}>
              {STATUS_LABEL[_status] ?? _status}
            </span>
          )}
        </div>
        <h1 className="db-hero__title">{_title}</h1>
        {_durationMinutes && (
          <p className="db-hero__teacher">회당 {_durationMinutes}분</p>
        )}
      </div>

      {showClassroomBtn && (
        <div className="db-hero__action-btns">
          <button
            className="db-hero__classroom-btn"
            onClick={() => navigate(`/classroom/${courseId}`)}
          >
            <span className="db-hero__classroom-btn__dot" />
            <IcVideo size={15} />
            실시간 강의실
          </button>
        </div>
      )}
    </div>
  )
}
