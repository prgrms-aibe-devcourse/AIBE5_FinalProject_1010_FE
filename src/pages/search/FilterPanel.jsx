/**
 * @file FilterPanel.jsx
 * @description 검색 페이지 왼쪽 필터 사이드바입니다.
 * - 과목, 학년, 수업 방식, 내공, 가격, 기타 조건을 보여줍니다.
 * - 현재는 화면 목업용 defaultChecked만 있으며 실제 필터 상태는 추후 연결 대상입니다.
 */
/**
 * 좌측 필터 사이드바.
 * - 과목 / 학년 / 수업 방식 / 선생님 내공 / 가격 / 기타
 */
export default function FilterPanel() {
  return (
    <aside className="filter-panel">
      <h3>필터</h3>
      <span className="reset-link">↻ 전체 초기화</span>

      <FilterGroup title="과목" items={[
        ['수학', '2,184', true], ['영어', '3,021'], ['국어', '986'],
        ['과학', '1,402'], ['사회', '724'], ['코딩', '512'],
      ]} />

      <FilterGroup title="학년" items={[
        ['초등'], ['중등'], ['고등', null, true], ['대입 N수생'], ['성인'],
      ]} />

      <FilterGroup title="수업 방식" items={[
        ['비대면 화상', null, true], ['대면 (오프라인)'], ['녹화 강의'],
      ]} />

      <div className="filter-group">
        <div className="filter-title">선생님 내공</div>
        <label className="filter-option"><input type="radio" name="rank" /> 마스터 (1000+)</label>
        <label className="filter-option"><input type="radio" name="rank" defaultChecked /> 고수 (500+)</label>
        <label className="filter-option"><input type="radio" name="rank" /> 중수 (100+)</label>
        <label className="filter-option"><input type="radio" name="rank" /> 전체</label>
      </div>

      <div className="filter-group">
        <div className="filter-title">가격 (월)</div>
        <div className="price-range"><span>0원</span><span>50만원+</span></div>
        <input type="range" min="0" max="50" defaultValue="25" />
      </div>

      <div className="filter-group">
        <div className="filter-title">기타</div>
        <label className="filter-option"><input type="checkbox" /> 무료 체험 가능</label>
        <label className="filter-option"><input type="checkbox" /> AI 추천 강의만</label>
      </div>
    </aside>
  )
}

/**
 * 반복되는 체크박스 필터 그룹을 그리는 작은 컴포넌트입니다.
 * items 원소 구조: [라벨, 개수, 기본체크여부]
 */
function FilterGroup({ title, items }) {
  return (
    <div className="filter-group">
      <div className="filter-title">{title}</div>
      {items.map(([name, count, checked]) => (
        <label className="filter-option" key={name}>
          <input type="checkbox" defaultChecked={checked} />
          {name}
          {count && <span className="count">{count}</span>}
        </label>
      ))}
    </div>
  )
}
