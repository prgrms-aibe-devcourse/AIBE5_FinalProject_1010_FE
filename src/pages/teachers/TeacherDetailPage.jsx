/**
 * @file TeacherDetailPage.jsx
 * @description 선생님 상세 정보 페이지입니다.
 * - 제공된 HTML 시안을 완벽히 React(JSX)로 마이그레이션했습니다.
 * - 정적 더미 데이터(teacherDetail.js)를 연동하여 기동하며 API 통신은 배제되었습니다.
 * - 스크랩 상태 토글 및 문의 메시지 전송 모션이 연동됩니다.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { teacherDetail as t } from '../../data/teacherDetail.js'
import Badge from '../../components/ui/Badge.jsx'

export default function TeacherDetailPage() {
  const navigate = useNavigate()
  const [scrapped, setScrapped] = useState(false)

  // 문의하기 모션 핸들러
  const handleContact = () => {
    alert(`${t.name} 선생님께 실시간 문의 메시지가 전송되었습니다. 곧 채팅 상담실로 연결됩니다! 💬`)
  }

  // 평점 별 렌더링 헬퍼
  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // 가격 포맷 헬퍼
  const formatPrice = (price) => {
    return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
  }

  return (
    <div className="teacher-detail-page">
      {/* 브레드크럼 브릿지 */}
      <div className="crumb">
        <Link to="/teachers">선생님 찾기</Link> › <Link to="/teachers">{t.subject}</Link> › <span>{t.name} 선생님</span>
      </div>

      {/* HERO SECTION */}
      <div className="t-hero">
        <span className={`avatar avatar--xl ${t.avatarColorClass}`} style={{ width: '110px', height: '110px', fontSize: '46px', border: '4px solid #fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
          {t.avatar}
        </span>
        <div>
          <div className="center gap-8 wrap mb-8">
            <span style={{ fontSize: '26px', fontWeight: '800', marginRight: '8px' }}>{t.name} 선생님</span>
            {t.isCert && <span className="badge badge--cert" style={{ marginRight: '6px' }}>✓ 인증 완료</span>}
            {t.isTop && <span className="badge badge--gold">🥇 이번 주 TOP</span>}
          </div>
          <div className="hand" style={{ color: 'var(--coral-dark)', fontSize: '22px', fontWeight: '700', transform: 'rotate(-1deg)', display: 'inline-block', margin: '4px 0' }}>
            {t.detailSubject}
          </div>
          <div className="fs15 fw7 muted mt-8">
            {t.education}
          </div>
          <div className="t-stats">
            <div className="t-stat">
              <b><span style={{ color: 'var(--coral)', marginRight: '4px' }}>★</span>{t.rating}</b>
              <div className="lbl">평점</div>
            </div>
            <div className="t-stat">
              <b>{t.students.toLocaleString()}</b>
              <div className="lbl">누적 수강생</div>
            </div>
            <div className="t-stat">
              <b style={{ color: 'var(--teal-dark)' }}>{t.naegongScore.toLocaleString()}</b>
              <div className="lbl">내공 점수</div>
            </div>
            <div className="t-stat">
              <b>{t.years}년</b>
              <div className="lbl">경력</div>
            </div>
          </div>
        </div>
        <div className="col gap-10" style={{ minWidth: '150px' }}>
          <button className="btn btn-coral btn--block" onClick={handleContact}>💬 문의하기</button>
          <button 
            className={`btn btn--block ${scrapped ? 'btn--coral-soft' : 'btn-secondary'}`}
            onClick={() => setScrapped(!scrapped)}
          >
            {scrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
          </button>
        </div>
      </div>

      <div className="detail">
        {/* MAIN AREA */}
        <div>
          {/* 자기소개 블록 */}
          <div className="block">
            <h2>📝 자기소개</h2>
            <p className="fs15 fw7" style={{ color: 'var(--ink)', lineHeight: '1.75', margin: '0 0 18px' }}>
              안녕하세요, 서울대 수학과 {t.name}입니다. {t.years}년간 200명이 넘는 학생을 가르치며 깨달은 건,{' '}
              <b style={{ color: 'var(--coral-dark)' }}>수학은 외우는 게 아니라 직접 풀어봐야 는다</b>는 거예요.
              그래서 저는 공유 화이트보드 위에서 학생이 직접 펜을 들고 풀게 하고, 막히는 순간 바로 옆에서 첨삭합니다.
              킬러문항도 원리만 잡으면 무섭지 않아요. 함께 1등급 만들어봐요!
            </p>
            <dl className="kv">
              <dt>학력</dt>
              <dd>{t.details.educationDetail}</dd>
              <dt>경력</dt>
              <dd>{t.details.careerDetail}</dd>
              <dt>수상</dt>
              <dd>{t.details.awardsDetail}</dd>
              <dt>수업방식</dt>
              <dd>{t.details.methodDetail}</dd>
            </dl>
          </div>

          {/* 운영 중인 수업 블록 */}
          <div className="block">
            <div className="sec-head">
              <h2>📚 운영 중인 수업</h2>
              <Link to="/courses" className="c-teal">전체 보기 →</Link>
            </div>
            <div className="grid-2">
              {t.courses.map((course) => (
                <div key={course.id} className="teacher-course-card">
                  <div className="teacher-course-card__title">{course.title}</div>
                  <div className="teacher-course-card__meta">
                    <Badge variant="sky">{course.subjectName}</Badge>
                    <Badge variant="butter">{course.targetGrade}</Badge>
                    <span className={`status-badge ${course.status}`}>
                      {course.status === 'RECRUITING' ? '모집 중' : '수강 중'}
                    </span>
                  </div>
                  <div className="teacher-course-card__price">
                    {formatPrice(course.pricePerSession)}
                    <span> / 1회 · {course.durationMinutes}분 · 최대 {course.maxStudents}명</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 평점 및 후기 블록 */}
          <div className="block">
            <h2>⭐ 선생님 평점 · 후기 <span className="fs15 muted fw7">(전체 수업 통합 · {t.reviews.length})</span></h2>
            {t.reviews.map((rev) => (
              <div key={rev.id} className="review">
                <div className="center between mb-8">
                  <div className="center gap-10">
                    <span className={`avatar--sm ${rev.avatarColorClass}`}>{rev.initial}</span>
                    <b className="fs14">{rev.name}</b>
                    <span className="fs13 muted">{rev.courseName} · {rev.date}</span>
                  </div>
                  <span style={{ color: 'var(--coral)' }}>{renderStars(rev.rating)}</span>
                </div>
                <p className="fs14 fw7" style={{ color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* STICKY SIDEBAR AREA */}
        <div className="side">
          <div className="ng-card">
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 14px', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              ⚡ 내공 획득 내역
            </h3>
            {t.naegongDetails.map((item, idx) => (
              <div key={idx} className="ng-row">
                <span>{item.label}</span>
                <span className="pt">+{item.points} pt</span>
              </div>
            ))}
            <div className="ng-row" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', marginTop: '8px', paddingTop: '14px', fontSize: '15px' }}>
              <span>총 누적 내공</span>
              <span className="pt" style={{ color: 'var(--yellow)', fontSize: '16px' }}>
                {t.naegongScore.toLocaleString()} pt
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
