export default function TeacherIntroBlock({ teacher }) {
  const { introduction, education, career, teachingStyle, awards } = teacher
  return (
    <div className="td-block">
      <h2 className="td-block__title">자기소개</h2>
      {introduction
        ? <p className="td-intro">{introduction}</p>
        : <p className="td-intro" style={{ color: 'var(--ink-mute)', fontStyle: 'italic' }}>소개글 준비 중입니다.</p>
      }
      <dl className="td-kv">
        <dt>학력</dt><dd>{education || '준비 중'}</dd>
        <dt>경력</dt><dd>{career || '준비 중'}</dd>
        <dt>수업방식</dt><dd>{teachingStyle || '준비 중'}</dd>
        {awards && <><dt>수상</dt><dd>{awards}</dd></>}
      </dl>
    </div>
  )
}
