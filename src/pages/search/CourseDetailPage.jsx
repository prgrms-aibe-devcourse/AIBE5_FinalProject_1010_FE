/**
 * @file CourseDetailPage.jsx
 * @description 수업 상세 페이지입니다.
 * - 더미 데이터(courseDetail.js)를 사용합니다.
 * - TeacherDetailPage와 동일한 레이아웃 패턴(block / detail / side)을 따릅니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseDetail as c } from '../../data/courseDetail.js'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'

export default function CourseDetailPage() {
  const [scrapped, setScrapped] = useState(false)
  const [applied, setApplied] = useState(false)

  const handleApply = () => {
    setApplied(true)
    alert(`${c.title}\n수업 신청이 완료되었습니다! 선생님이 곧 연락드릴 거예요. 📚`)
  }

  const renderStars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)
  const spotsLeft = c.maxStudents - c.currentStudents
  const totalPrice = (c.pricePerSession * c.totalSessions).toLocaleString()

  return (
    <div className="course-detail-page">
      {/* 브레드크럼 */}
      <div className="crumb">
        <Link to="/courses">수업 찾기</Link> › <Link to="/courses">{c.subjectName}</Link> › <span>{c.title}</span>
      </div>

      {/* ── Hero ── */}
      <div className="cd-hero">
        {/* 썸네일 */}
        <div className={`cd-thumb ${c.thumbnailBg}`}>
          <div className="cd-thumb-text">
            {c.subject}
            <span className="cd-thumb-hand">{c.hand}</span>
          </div>
          <div className="cd-thumb-chips">
            <Badge variant="mint">모집 중</Badge>
            <Badge variant="butter">잔여 {spotsLeft}석</Badge>
          </div>
        </div>

        {/* 수업 정보 */}
        <div className="cd-hero-info">
          <div className="cd-hero-meta">
            <Badge variant="peach">{c.subjectName}</Badge>
            <Badge>{c.gradeLabel}</Badge>
            <Badge variant="sky">{c.mode}</Badge>
          </div>

          <h1 className="cd-title">{c.title}</h1>

          <div className="cd-teacher-row">
            <Avatar size="md" color={c.teacher.avatar}>{c.teacher.initial}</Avatar>
            <div className="cd-teacher-row-info">
              <div className="cd-tname">{c.teacher.name} 선생님</div>
              <div className="cd-tschool">{c.teacher.school} · 내공 {c.teacher.naegong.toLocaleString()}</div>
            </div>
          </div>

          <div className="cd-stats">
            <div className="cd-stat">
              <span className="cd-stat-val star">★ {c.rating}</span>
              <span className="cd-stat-label">평점</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val">{c.reviewCount}</span>
              <span className="cd-stat-label">후기</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val">{c.currentStudents}/{c.maxStudents}</span>
              <span className="cd-stat-label">수강생</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val">{c.durationMinutes}분</span>
              <span className="cd-stat-label">1회 수업</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val">{c.totalSessions}회</span>
              <span className="cd-stat-label">총 회차</span>
            </div>
          </div>

          <div className="cd-tags">
            {c.tags.map((tag) => (
              <Badge key={tag} variant="lavender">#{tag}</Badge>
            ))}
          </div>
        </div>

        {/* 우측 CTA (데스크탑 전용) */}
        <div className="cd-hero-cta">
          <div className="cd-price-big">
            <span className="cd-price-val">{c.pricePerSession.toLocaleString()}원</span>
            <span className="cd-price-unit"> /1회</span>
          </div>
          <button className="btn btn-coral btn--block" onClick={handleApply}>
            {applied ? '✓ 신청 완료' : '📚 수업 신청하기'}
          </button>
          <button
            className={`btn btn--block ${scrapped ? 'btn--coral-soft' : 'btn-secondary'}`}
            onClick={() => setScrapped((s) => !s)}
          >
            {scrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
          </button>
          <div className="cd-schedule-info">
            <div>📅 {c.schedule}</div>
            <div>🗓 {c.startDate} 시작</div>
            <div>👥 최대 {c.maxStudents}명 소규모</div>
          </div>
        </div>
      </div>

      {/* ── 본문 2열 ── */}
      <div className="detail">
        {/* 메인 콘텐츠 */}
        <div>
          {/* 수업 소개 */}
          <div className="block">
            <h2>📝 수업 소개</h2>
            <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.75, color: 'var(--ink)', marginBottom: 20 }}>
              {c.intro}
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🎯 이런 분들께 추천해요</h3>
            <ul className="cd-highlights">
              {c.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>

          {/* 커리큘럼 */}
          <div className="block">
            <h2>📚 {c.totalSessions / 3}주 커리큘럼</h2>
            <div className="cd-curriculum">
              {c.curriculum.map((row) => (
                <div key={row.week} className="cd-curriculum-row">
                  <div className="cd-week">{row.week}주차</div>
                  <div>
                    <div className="cd-week-title">{row.title}</div>
                    <div className="cd-week-topics">{row.topics}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 후기 */}
          <div className="block">
            <h2>⭐ 수강 후기 <span style={{ fontSize: 15, color: 'var(--ink-soft)', fontWeight: 700 }}>({c.reviewCount})</span></h2>
            {c.reviews.map((rev) => (
              <div key={rev.id} className="review">
                <div className="center between mb-8">
                  <div className="center gap-10">
                    <span className={`avatar--sm ${rev.avatarClass}`}>{rev.initial}</span>
                    <b style={{ fontSize: 14 }}>{rev.name}</b>
                    <span className="fs13 muted">{rev.courseName} · {rev.date}</span>
                  </div>
                  <span style={{ color: 'var(--coral)' }}>{renderStars(rev.rating)}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="side">
          {/* 신청 카드 */}
          <div className="cd-apply-card">
            <div className="cd-apply-price">
              {c.pricePerSession.toLocaleString()}원<span> /1회</span>
            </div>
            <div className="cd-apply-total">총 {c.totalSessions}회 · {totalPrice}원</div>

            <div className="cd-apply-info">
              <div className="cd-apply-row">
                <span className="cd-apply-row-label">일정</span>{c.schedule}
              </div>
              <div className="cd-apply-row">
                <span className="cd-apply-row-label">시작일</span>{c.startDate}
              </div>
              <div className="cd-apply-row">
                <span className="cd-apply-row-label">인원</span>현재 {c.currentStudents}명 / 최대 {c.maxStudents}명
              </div>
              <div className="cd-apply-row">
                <span className="cd-apply-row-label">1회</span>{c.durationMinutes}분
              </div>
            </div>

            <button className="btn btn-coral btn--block" onClick={handleApply}>
              {applied ? '✓ 신청 완료' : '📚 지금 신청하기'}
            </button>
            <button
              className={`btn btn--block ${scrapped ? 'btn--coral-soft' : 'btn-secondary'}`}
              style={{ marginTop: 8 }}
              onClick={() => setScrapped((s) => !s)}
            >
              {scrapped ? '♥ 스크랩됨' : '♡ 스크랩'}
            </button>

            <div className="cd-apply-spot">잔여 {spotsLeft}석 · 마감이 임박했어요!</div>
          </div>

          {/* 선생님 카드 */}
          <div className="cd-teacher-card">
            <h3>👨‍🏫 선생님 소개</h3>
            <div className="cd-tc-row">
              <Avatar size="lg" color={c.teacher.avatar}>{c.teacher.initial}</Avatar>
              <div>
                <div className="cd-tc-name">{c.teacher.name} 선생님</div>
                <div className="cd-tc-school">{c.teacher.school}</div>
              </div>
            </div>
            <p className="cd-tc-intro">{c.teacher.intro}</p>
            <div className="cd-tc-stats">
              <span>★ {c.teacher.rating} 평점</span>
              <span>{c.teacher.students.toLocaleString()}명 수강</span>
              <span>{c.teacher.years}년 경력</span>
            </div>
            <Link
              to={`/teachers/${c.teacher.id}`}
              className="btn btn-secondary btn--block"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              선생님 프로필 보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
