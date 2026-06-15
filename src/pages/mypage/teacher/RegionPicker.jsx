import { useState, useEffect, useRef } from 'react'
import { REGIONS, SIDO_LIST } from '../../../data/regions.js'

/**
 * 전국 시/도 → 시/군/구 3단계 지역 선택 모달.
 *
 * @param value     단일 선택 모드에서 현재 선택된 지역 문자열 (예: "서울 강남구")
 * @param onChange  단일: onChange(string), 다중: onChange(string[])
 * @param onClose   패널 닫기
 * @param multi     true면 다중 선택 모드 — 클릭 시 닫지 않고 selected 배열을 토글, 하단 칩+완료 버튼 표시
 * @param selected  다중 모드에서 현재 선택된 지역 배열
 */
export default function RegionPicker({
  value    = '',
  onChange,
  onClose,
  multi    = false,
  selected = [],
}) {
  const sidoData = (sido) => REGIONS[sido]
  const isFlat   = (sido) => Array.isArray(sidoData(sido))

  const initSido = () => {
    if (!value) return SIDO_LIST[0]
    return SIDO_LIST.find(s => value === s || value.startsWith(s + ' ')) ?? SIDO_LIST[0]
  }
  const initSigungu = (sido) => {
    if (!value || isFlat(sido)) return null
    const rest = value.startsWith(sido + ' ') ? value.slice(sido.length + 1) : ''
    return Object.keys(sidoData(sido)).find(sg => rest === sg || rest.startsWith(sg + ' ')) ?? null
  }

  const [selectedSido,    setSelectedSido]    = useState(multi ? SIDO_LIST[0] : initSido)
  const [selectedSigungu, setSelectedSigungu] = useState(() => multi ? null : initSigungu(initSido()))
  const panelRef = useRef(null)

  useEffect(() => {
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

  const handleSido = (sido) => { setSelectedSido(sido); setSelectedSigungu(null) }

  // 최종 지역 선택 — 단일: onChange(string)+닫기, 다중: 배열 토글(닫지 않음)
  const commit = (region) => {
    if (multi) {
      onChange(selected.includes(region)
        ? selected.filter(r => r !== region)
        : [...selected, region])
    } else {
      onChange(region)
      onClose()
    }
  }

  const handleSigungu = (sigungu) => {
    const subs = sidoData(selectedSido)[sigungu]
    if (!subs || subs.length === 0) commit(`${selectedSido} ${sigungu}`)
    else setSelectedSigungu(sigungu)
  }

  const handleGu     = (gu) => commit(`${selectedSido} ${selectedSigungu} ${gu}`)
  const handleFlatGu = (gu) => commit(`${selectedSido} ${gu}`)

  // 선택 여부 — 단일: value 비교, 다중: selected 배열 포함 여부
  const isOn = (region) => multi ? selected.includes(region) : value === region

  // 단일 모드 강조용 파싱
  const parts = value?.split(' ') ?? []
  const [cvSido, cvSigungu, cvGu] = parts

  const flat         = isFlat(selectedSido)
  const sigunguData  = !flat ? sidoData(selectedSido) : null
  const guList       = selectedSigungu ? sigunguData?.[selectedSigungu] : null
  const showThreePanel = !flat && selectedSigungu && guList?.length > 0

  return (
    <div className="rp-overlay">
      <div
        className={`rp-panel${showThreePanel ? ' rp-panel--wide' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={multi ? '지역 선택 (다중)' : '지역 선택'}
      >
        <div className="rp-header">
          <span className="rp-title">
            지역 선택{multi && <span className="rp-multi-hint">중복 선택 가능</span>}
          </span>
          <button className="rp-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="rp-body">
          {/* 1열: 시/도 */}
          <ul className="rp-sido" role="tablist">
            {SIDO_LIST.map(sido => (
              <li
                key={sido}
                role="tab"
                aria-selected={selectedSido === sido}
                className={`rp-sido-item${selectedSido === sido ? ' active' : ''}`}
                onClick={() => handleSido(sido)}
              >
                {sido}
              </li>
            ))}
          </ul>

          {/* 2열: 구(flat) 또는 시/군 */}
          {flat ? (
            <ul className="rp-sigungu" role="listbox">
              {sidoData(selectedSido).map(gu => {
                const full = `${selectedSido} ${gu}`
                const on   = isOn(full) || (!multi && cvSido === selectedSido && cvSigungu === gu && !cvGu)
                return (
                  <li
                    key={gu} role="option" aria-selected={on}
                    className={`rp-sigungu-item${on ? ' selected' : ''}`}
                    onClick={() => handleFlatGu(gu)}
                  >
                    {gu}
                    {on && <span className="rp-check" aria-hidden="true">✓</span>}
                  </li>
                )
              })}
            </ul>
          ) : (
            <ul className="rp-sigungu" role="listbox">
              {Object.entries(sigunguData).map(([sg, subs]) => {
                const full     = `${selectedSido} ${sg}`
                const isFocused = selectedSigungu === sg
                const on        = (!subs || !subs.length) &&
                  (isOn(full) || (!multi && !subs && cvSido === selectedSido && cvSigungu === sg && !cvGu))
                return (
                  <li
                    key={sg} role="option" aria-selected={on}
                    className={`rp-sigungu-item${isFocused ? ' focused' : ''}${on ? ' selected' : ''}`}
                    onClick={() => handleSigungu(sg)}
                  >
                    <span>{sg}</span>
                    {subs?.length > 0
                      ? <span className="rp-arrow" aria-hidden="true">›</span>
                      : on && <span className="rp-check" aria-hidden="true">✓</span>
                    }
                  </li>
                )
              })}
            </ul>
          )}

          {/* 3열: 구 */}
          {showThreePanel && (
            <ul className="rp-gu" role="listbox">
              {guList.map(gu => {
                const full = `${selectedSido} ${selectedSigungu} ${gu}`
                const on   = isOn(full) || (!multi && cvSido === selectedSido && cvSigungu === selectedSigungu && cvGu === gu)
                return (
                  <li
                    key={gu} role="option" aria-selected={on}
                    className={`rp-sigungu-item${on ? ' selected' : ''}`}
                    onClick={() => handleGu(gu)}
                  >
                    {gu}
                    {on && <span className="rp-check" aria-hidden="true">✓</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* 다중 모드: 하단 선택 칩 + 완료 */}
        {multi && (
          <div className="rp-footer">
            <div className="rp-selected-chips">
              {selected.length === 0
                ? <span className="rp-selected-empty">선택된 지역이 없어요</span>
                : selected.map(r => (
                    <button key={r} className="rp-selected-chip"
                      onClick={() => onChange(selected.filter(x => x !== r))}>
                      {r} <span aria-hidden="true">×</span>
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
