import { formatDate } from '../../../utils/format.js'
import { TEACHING_MODE_LABEL } from '../../../utils/labels.js'

const CURRICULUM_LABELS = { FIXED: '정규 커리큘럼', FLEXIBLE: '맞춤형 커리큘럼', CUSTOM: '맞춤형 커리큘럼' }

export default function CourseInfoBlock({
  description, textbook, curriculumType, curriculumDetail,
  availableSchedule, startDate, endDate, durationMinutes,
  currentStudents, maxStudents,
  teachingMode, location, firstClassDate, recruitDeadline,
}) {
  const hasAny = description || textbook || curriculumType || curriculumDetail
    || availableSchedule || startDate || endDate || durationMinutes
    || teachingMode || firstClassDate || recruitDeadline
  if (!hasAny) return null

  const spotsLeft = (maxStudents ?? 0) - (currentStudents ?? 0)
  const isOffline = teachingMode === 'OFFLINE'

  return (
    <div className="cd-block">
      <h2 className="cd-block__title">수업 정보</h2>
      <dl className="cd-kv">
        {description       && <><dt>수업 소개</dt>   <dd>{description}</dd></>}
        {curriculumType    && <><dt>커리큘럼</dt>    <dd>{CURRICULUM_LABELS[curriculumType] ?? curriculumType}</dd></>}
        {curriculumDetail  && <><dt>상세 내용</dt>   <dd>{curriculumDetail}</dd></>}
        {textbook          && <><dt>사용 교재</dt>   <dd>{textbook}</dd></>}
        {teachingMode      && (
          <><dt>수업 방식</dt><dd>
            {TEACHING_MODE_LABEL[teachingMode] ?? teachingMode}
            {isOffline && location && <span style={{ color: 'var(--ink-soft)' }}> · {location}</span>}
          </dd></>
        )}
        {availableSchedule && <><dt>가능 시간대</dt> <dd>{availableSchedule}</dd></>}
        {firstClassDate    && <><dt>첫 수업</dt>     <dd>{firstClassDate}</dd></>}
        {(startDate || endDate) && (
          <><dt>수업 기간</dt><dd>{formatDate(startDate)} ~ {formatDate(endDate)}</dd></>
        )}
        {recruitDeadline   && <><dt>모집 마감</dt>   <dd>{formatDate(recruitDeadline)}</dd></>}
        {durationMinutes   && <><dt>회당 시간</dt>   <dd>{durationMinutes}분</dd></>}
        {maxStudents != null && (
          <><dt>정원</dt><dd>
            {currentStudents ?? 0}/{maxStudents}명
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700,
              color: spotsLeft > 0 ? 'var(--teal-dark)' : 'var(--coral)' }}>
              ({spotsLeft > 0 ? `${spotsLeft}자리 남음` : '마감'})
            </span>
          </dd></>
        )}
        <dt>구체 일정</dt><dd>1:1 수업은 매칭 후 선생님과 협의합니다.</dd>
      </dl>
    </div>
  )
}
