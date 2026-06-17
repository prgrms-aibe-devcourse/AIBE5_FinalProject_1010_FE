import { getNaegongTier } from '../../../utils/naegong.js'
import { GENDER_LABEL } from '../../../utils/labels.js'
import { VerifiedBadgeIcon } from '../../../components/icons/SearchIcons.jsx'

export default function TeacherSidebar({ teacher, courseCount }) {
  const { naegongScore, address, totalTeachingHours, answerCount, acceptRate,
          career, major, admissionYear, gender, awards, verified } = teacher
  const tier = getNaegongTier(naegongScore)
  const teachingHours = totalTeachingHours != null ? Number(totalTeachingHours) : null
  const specialties = teacher.specialtySubjects ?? []

  return (
    <aside className="td-side">
      <div className={`td-verify-card${verified ? ' td-verify-card--ok' : ' td-verify-card--no'}`}>
        <span className="td-verify-card__ic">
          {verified
            ? <VerifiedBadgeIcon size={24} />
            : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                <path d="M12 9v4" /><path d="M12 16.5v.01" />
              </svg>
            )}
        </span>
        <div className="td-verify-card__text">
          <b>{verified ? '학력 인증 완료' : '미인증 선생님'}</b>
          {!verified && <span>아직 학력 인증을 받지 않았어요</span>}
        </div>
      </div>

      <div className="td-profile-card">
        <h2 className="td-profile-card__title">기본 정보</h2>
        <dl className="td-profile-kv">
          <dt>대학교</dt><dd>{career || '준비 중'}</dd>
          <dt>전공</dt><dd>{major || '준비 중'}</dd>
          <dt>학번</dt><dd>{admissionYear || '준비 중'}</dd>
          {specialties.length > 0 && <><dt>전문 과목</dt><dd>{specialties.join(', ')}</dd></>}
          {gender && GENDER_LABEL[gender] && <><dt>성별</dt><dd>{GENDER_LABEL[gender]}</dd></>}
          {awards && <><dt>수상</dt><dd>{awards}</dd></>}
        </dl>
      </div>

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
        {teachingHours != null && teachingHours > 0 && (
          <div className="td-ng-row"><span>누적 수업</span><span className="td-ng-pt">{teachingHours.toLocaleString('ko-KR')}시간</span></div>
        )}
        {address && <div className="td-ng-row"><span>지역</span><span className="td-ng-pt">{address}</span></div>}
      </div>

      <div className="td-activity">
        <h2 className="td-block__title" style={{ fontSize: 15, marginBottom: 12 }}>질문게시판 활동</h2>
        <div className="td-activity-row">
          <span>작성 답변</span>
          <b>{answerCount != null ? `${answerCount.toLocaleString('ko-KR')}개` : '0개'}</b>
        </div>
        <div className="td-activity-row">
          <span>채택률</span>
          <b style={{ color: 'var(--teal-dark)' }}>
            {acceptRate != null ? `${acceptRate}%` : '답변 없음'}
          </b>
        </div>
      </div>
    </aside>
  )
}
