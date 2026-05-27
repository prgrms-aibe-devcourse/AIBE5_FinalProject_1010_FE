function CourseDetailPage() {
  const course = {
    title: '고2 수학 1:1 과외',
    teacher: '김현우 선생님',
    description: '내신과 수능을 함께 준비하는 수업입니다.',
    price: '월 30만원',
    category: '수학',
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1>{course.title}</h1>

      <hr />

      <h3>선생님</h3>
      <p>{course.teacher}</p>

      <h3>과목</h3>
      <p>{course.category}</p>

      <h3>수업 소개</h3>
      <p>{course.description}</p>

      <h3>가격</h3>
      <p>{course.price}</p>

      <button>수강 신청하기</button>
    </div>
  )
}

export default CourseDetailPage