/**
 * @file QnaToolbar.jsx
 * @description 질문게시판 검색/필터/정렬 영역입니다.
 */
import { qnaSubjects } from '../../data/qnaPosts.js'

export default function QnaToolbar({
  filters,
  resultCount,
  onFilterChange,
  onReset,
  onOpenWrite,
}) {
  const update = (key, value) => onFilterChange({ ...filters, [key]: value })

  return (
    <section className="qna-toolbar" aria-label="질문게시판 검색과 필터">
      <div className="qna-toolbar__search">
        <label className="qna-toolbar__label" htmlFor="qna-keyword">질문 검색</label>
        <div className="qna-toolbar__searchbox">
          <input
            id="qna-keyword"
            type="search"
            value={filters.keyword}
            placeholder="제목, 내용, 과목으로 검색"
            onChange={(event) => update('keyword', event.target.value)}
          />
          <button type="button" onClick={() => update('keyword', filters.keyword.trim())}>
            검색
          </button>
        </div>
      </div>

      <div className="qna-toolbar__filters">
        <label>
          과목
          <select value={filters.subject} onChange={(event) => update('subject', event.target.value)}>
            {qnaSubjects.map((subject) => <option key={subject}>{subject}</option>)}
          </select>
        </label>

        <label>
          상태
          <select value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value="all">전체</option>
            <option value="waiting">답변 대기</option>
            <option value="resolved">해결됨</option>
          </select>
        </label>

        <label>
          정렬
          <select value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="latest">최신순</option>
            <option value="answers">답변 많은순</option>
            <option value="views">조회 많은순</option>
          </select>
        </label>
      </div>

      <div className="qna-toolbar__bottom">
        <p><strong>{resultCount}</strong>개의 질문을 찾았습니다</p>
        <div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onReset}>초기화</button>
          <button className="btn btn-primary btn-sm" type="button" onClick={onOpenWrite}>질문 작성</button>
        </div>
      </div>
    </section>
  )
}
