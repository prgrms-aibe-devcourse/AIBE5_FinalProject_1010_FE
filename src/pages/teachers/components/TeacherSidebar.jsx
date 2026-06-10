import { getNaegongTier } from '../../../utils/naegong.js'

export default function TeacherSidebar({ teacher, courseCount }) {
  const { naegongScore, address } = teacher
  const tier = getNaegongTier(naegongScore)

  return (
    <aside className="td-side">
      <div className="td-ng-card">
        <div className="td-ng-card__head">
          <b>내공 점수</b>
        </div>
        <div className={`td-ng-card__score ${tier.cls}`}>{naegongScore}</div>
        <p className="td-ng-card__desc">
          질문게시판 답변 채택과 누적 수업 시간으로 쌓인 신뢰 점수예요.
        </p>
        <div className="td-ng-row"><span>등급</span><span className="td-ng-pt">{tier.label}</span></div>
        <div className="td-ng-row"><span>강의 수</span><span className="td-ng-pt">{courseCount}개</span></div>
        {address && <div className="td-ng-row"><span>지역</span><span className="td-ng-pt">{address}</span></div>}
      </div>

      <div className="td-activity">
        <h2 className="td-block__title" style={{ fontSize: 15, marginBottom: 12 }}>질문게시판 활동</h2>
        <div className="td-activity-row">
          <span>작성 답변</span>
          <b>{teacher.answerCount != null ? `${teacher.answerCount}개` : '준비 중'}</b>
        </div>
        <div className="td-activity-row">
          <span>채택률</span>
          <b style={{ color: 'var(--teal-dark)' }}>
            {teacher.acceptRate != null ? `${teacher.acceptRate}%` : '준비 중'}
          </b>
        </div>
        <div className="td-activity-row">
          <span>전문 과목</span>
          <b>{teacher.specialty || '준비 중'}</b>
        </div>
        <div className="td-activity-row">
          <span>최근 답변</span>
          <b style={{ color: 'var(--ink-mute)' }}>{teacher.recentAnswer ?? '준비 중'}</b>
        </div>
      </div>
    </aside>
  )
}
