import { useState, useEffect, useRef, useMemo } from 'react'
import { UNIVERSITIES } from '../../data/universities.js'

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
 * 다중 선택 대학교 피커. 선생님 찾기 필터용.
 *
 * 마이페이지의 UniversityPicker(단일 선택)와 동일한 검색 UI를 사용하되,
 * 결과를 클릭하면 닫지 않고 선택 목록(selected)에 토글한다.
 *
 * @param selected 현재 선택된 대학교 문자열 배열
 * @param onChange 선택 배열이 바뀔 때 호출 (새 배열 전달)
 * @param onClose  패널 닫기
 */
export default function UniversityMultiPicker({ selected = [], onChange, onClose }) {
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

  // 검색어가 목록에 정확히 없을 때 직접 추가 옵션 노출
  const showCustom = kw && !UNIVERSITIES.some(u => u === kw)

  const toggle = (name) => {
    onChange(
      selected.includes(name)
        ? selected.filter(u => u !== name)
        : [...selected, name]
    )
  }

  return (
    <div className="rp-overlay">
      <div
        className="rp-panel up-panel up-panel--multi"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="대학교 검색 (다중)"
      >
        <div className="rp-header">
          <span className="rp-title">대학교 검색 <span className="rp-multi-hint">중복 선택 가능</span></span>
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
          {results.map(name => {
            const isOn = selected.includes(name)
            return (
              <li
                key={name}
                role="option"
                aria-selected={isOn}
                className={`rp-sigungu-item${isOn ? ' selected' : ''}`}
                onClick={() => toggle(name)}
              >
                <span>{highlight(name, kw)}</span>
                {isOn && <span className="rp-check" aria-hidden="true">✓</span>}
              </li>
            )
          })}

          {showCustom && (
            <li
              role="option"
              className="rp-sigungu-item up-custom"
              onClick={() => toggle(kw)}
            >
              <span>직접 추가: “<strong>{kw}</strong>”</span>
            </li>
          )}

          {!results.length && !showCustom && (
            <li className="up-empty">{kw ? '검색 결과가 없어요' : '학교 이름을 검색해보세요'}</li>
          )}
        </ul>

        {/* 하단: 선택된 대학교 칩 + 완료 */}
        <div className="rp-footer">
          <div className="rp-selected-chips">
            {selected.length === 0
              ? <span className="rp-selected-empty">선택된 대학교가 없어요</span>
              : selected.map(u => (
                  <button key={u} className="rp-selected-chip" onClick={() => toggle(u)}>
                    {u} <span aria-hidden="true">×</span>
                  </button>
                ))
            }
          </div>
          <button className="btn btn-primary btn-sm rp-done" onClick={onClose}>완료</button>
        </div>
      </div>
    </div>
  )
}
