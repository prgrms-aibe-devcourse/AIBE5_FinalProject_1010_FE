/**
 * @file CategoriesSection.jsx
 * @description 분야별 인기 수업 카테고리 카드 섹션입니다.
 * - categories.js 데이터를 map으로 반복 렌더링합니다.
 * - 카드를 누르면 현재는 /search로 이동합니다.
 */
import { Link } from 'react-router-dom'
import { categories } from '../../data/categories.js'

/**
 * 분야별 인기 수업 카테고리 (6개 카드 그리드)
 */
export default function CategoriesSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow yellow">📚 분야별 인기 수업</span>
        <h2 className="section-title">무엇을 배우고 <span className="hand">싶나요?</span></h2>
        <p className="section-subtitle">초·중·고부터 대학 입시, 자격증까지 한 번에</p>
        <div className="cats">
          {/* categories.js의 카테고리 배열을 카드 목록으로 렌더링합니다. */}
          {categories.map((c) => (
            <Link to="/courses" className="cat" key={c.name}>
              <div className="cat-icon" style={{ background: c.bg }}>{c.icon}</div>
              <div className="cat-name">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
