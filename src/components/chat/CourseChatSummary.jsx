export default function CourseChatSummary({
  isManage,
  loading,
  room,
  selectedCourse,
  studentCount,
}) {
  const title = isManage
    ? room?.courseTitle || room?.name
    : selectedCourse?.title || '수업을 선택하세요'

  return (
    <div className="cw-course-summary">
      <b>{title}</b>
      <small>{loading ? '불러오는 중...' : `수강생 ${studentCount}명`}</small>
    </div>
  )
}
