import { useState, useEffect, useRef, useMemo } from 'react'
import { UNIVERSITIES } from '../../../data/universities.js'

const MAX_RESULTS = 50

// 검색어와 일치하는 부분을 강조 표시
function highlight(name, keyword) {
  if (!keyword) return name
  const idx = name.indexOf(keyword)
  if (idx === -1) return name
  return (
    <>
      {name.slice(0, idx)}
      <span className="up-hl">{name.slice(idx, idx + keyword.length)}</span>
      {name.slice(idx + keyword.length)}
    </>
  )
}

/**
 * 대학교 검색 모달.
 * 정적 목록(UNIVERSITIES)을 클라이언트에서 필터링하며,
 * 목록에 없는 학교는 입력한 검색어 그대로 직접 등록할 수 있다.
 */
export default function UniversityPicker({ value, onChange, onClose }) {
  const [keyword, setKeyword] = useState('')
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const kw = keyword.trim()

  const results = useMemo(() => {
    if (!kw) return []
    return UNIVERSITIES.filter(u => u.includes(kw)).slice(0, MAX_RESULTS)
  }, [kw])

  // 검색어가 목록에 정확히 없을 때 직접 입력 옵션 노출
  const showCustom = kw && !UNIVERSITIES.some(u => u === kw)

  const select = (name) => {
    onChange(name)
    onClose()
  }

  return (
    <div className="rp-overlay">
      <div
        className="rp-panel up-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="대학교 검색"
      >
        <div className="rp-header">
          <span className="rp-title">대학교 검색</span>
          <button className="rp-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="up-search-wrap">
          <span className="up-search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            className="up-search"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="학교 이름을 입력하세요"
          />
        </div>

        <ul className="up-list" role="listbox">
          {results.map(name => (
            <li
              key={name}
              role="option"
              aria-selected={value === name}
              className={`rp-sigungu-item${value === name ? ' selected' : ''}`}
              onClick={() => select(name)}
            >
              <span>{highlight(name, kw)}</span>
              {value === name && <span className="rp-check" aria-hidden="true">✓</span>}
            </li>
          ))}

          {showCustom && (
            <li
              role="option"
              className="rp-sigungu-item up-custom"
              onClick={() => select(kw)}
            >
              <span>직접 입력: “<strong>{kw}</strong>” 사용</span>
            </li>
          )}

          {!results.length && !showCustom && (
            <li className="up-empty">{kw ? '검색 결과가 없어요' : '학교 이름을 검색해보세요'}</li>
          )}
        </ul>
      </div>
    </div>
  )
}
