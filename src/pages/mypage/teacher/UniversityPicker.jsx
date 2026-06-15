import { useState, useEffect, useRef, useMemo } from 'react'
import { UNIVERSITIES } from '../../../data/universities.js'

const MAX_RESULTS = 50

function highlight(name, keyword) {
  if (!keyword) return name
  const idx = name.toLowerCase().indexOf(keyword.toLowerCase())
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
 *
 * @param value     단일 선택 모드에서 현재 선택된 대학교명
 * @param onChange  단일: onChange(string), 다중: onChange(string[])
 * @param onClose   패널 닫기
 * @param multi     true면 다중 선택 모드 — 클릭 시 닫지 않고 selected 배열을 토글, 하단 칩+완료 버튼 표시
 * @param selected  다중 모드에서 현재 선택된 대학교 배열
 */
export default function UniversityPicker({
  value    = '',
  onChange,
  onClose,
  multi    = false,
  selected = [],
}) {
  const [keyword, setKeyword] = useState('')
  const panelRef   = useRef(null)
  const inputRef   = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    inputRef.current?.focus()
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onCloseRef.current()
    }
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const kw = keyword.trim()

  const results = useMemo(() => {
    if (!kw) return []
    const lower = kw.toLowerCase()
    return UNIVERSITIES.filter(u => u.toLowerCase().includes(lower)).slice(0, MAX_RESULTS)
  }, [kw])

  const showCustom = kw && !UNIVERSITIES.some(u => u.toLowerCase() === kw.toLowerCase())

  // 최종 선택 — 단일: onChange(string)+닫기, 다중: 배열 토글(닫지 않음)
  const commit = (name) => {
    if (multi) {
      onChange(selected.includes(name) ? selected.filter(u => u !== name) : [...selected, name])
    } else {
      onChange(name)
      onClose()
    }
  }

  const isOn = (name) => multi ? selected.includes(name) : value === name

  return (
    <div className="rp-overlay">
      <div
        className={`rp-panel up-panel${multi ? ' up-panel--multi' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={multi ? '대학교 검색 (다중)' : '대학교 검색'}
      >
        <div className="rp-header">
          <span className="rp-title">
            대학교 검색{multi && <span className="rp-multi-hint">중복 선택 가능</span>}
          </span>
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
            const on = isOn(name)
            return (
              <li
                key={name} role="option" aria-selected={on}
                className={`rp-sigungu-item${on ? ' selected' : ''}`}
                onClick={() => commit(name)}
              >
                <span>{highlight(name, kw)}</span>
                {on && <span className="rp-check" aria-hidden="true">✓</span>}
              </li>
            )
          })}

          {showCustom && (
            <li role="option" className="rp-sigungu-item up-custom" onClick={() => commit(kw)}>
              <span>{multi ? '직접 추가: ' : '직접 입력: '}"<strong>{kw}</strong>"{multi ? '' : ' 사용'}</span>
            </li>
          )}

          {!results.length && !showCustom && (
            <li className="up-empty">{kw ? '검색 결과가 없어요' : '학교 이름을 검색해보세요'}</li>
          )}
        </ul>

        {/* 다중 모드: 하단 선택 칩 + 완료 */}
        {multi && (
          <div className="rp-footer">
            <div className="rp-selected-chips">
              {selected.length === 0
                ? <span className="rp-selected-empty">선택된 대학교가 없어요</span>
                : selected.map(u => (
                    <button key={u} className="rp-selected-chip"
                      onClick={() => onChange(selected.filter(x => x !== u))}>
                      {u} <span aria-hidden="true">×</span>
                    </button>
                  ))
              }
            </div>
            <button className="btn btn-primary btn-sm rp-done" onClick={onClose}>완료</button>
          </div>
        )}
      </div>
    </div>
  )
}
