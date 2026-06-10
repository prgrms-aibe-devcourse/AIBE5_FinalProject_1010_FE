import { formatDate } from '../../../utils/format.js'

export default function CourseScheduleBlock({ availableSchedule, startDate, endDate, durationMinutes }) {
  return (
    <div className="cd-block">
      <h2 className="cd-block__title">일정 정보</h2>
      <dl className="cd-kv">
        {availableSchedule && <><dt>가능 시간대</dt><dd>{availableSchedule}</dd></>}
        <dt>수업 기간</dt><dd>{formatDate(startDate)} ~ {formatDate(endDate)}</dd>
        {durationMinutes   && <><dt>회당 시간</dt><dd>{durationMinutes}분</dd></>}
        <dt>구체 일정</dt><dd>1:1 수업은 매칭 후 선생님과 협의합니다.</dd>
      </dl>
    </div>
  )
}
