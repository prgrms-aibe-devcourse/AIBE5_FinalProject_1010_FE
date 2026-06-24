export default function TeacherIntroBlock({ teacher }) {
  const { introduction, teachingStyle } = teacher
  return (
    <>
      <div className="td-block">
        <h2 className="td-block__title">자기소개</h2>
        {introduction
          ? <p className="td-intro td-intro--last">{introduction}</p>
          : <p className="td-intro td-intro--last td-intro--empty">소개글 준비 중입니다.</p>
        }
      </div>

      <div className="td-block">
        <h2 className="td-block__title">수업 방식</h2>
        {teachingStyle
          ? <p className="td-intro td-intro--last">{teachingStyle}</p>
          : <p className="td-intro td-intro--last td-intro--empty">수업 방식 소개 준비 중입니다.</p>
        }
      </div>
    </>
  )
}
