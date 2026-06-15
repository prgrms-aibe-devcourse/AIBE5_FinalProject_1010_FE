import { useState, useEffect, useRef } from 'react'
import { REGIONS, SIDO_LIST } from '../../data/regions.js'

/**
 * 다중 선택 지역 피커. 선생님 찾기 필터용.
 *
 * 마이페이지의 RegionPicker(단일 선택)와 동일한 시/도 → 시/군/구 3단계 네비게이션을
 * 사용하되, 최종 지역을 클릭하면 닫지 않고 선택 목록(selected)에 토글한다.
 *
 * @param selected  현재 선택된 지역 문자열 배열 (예: ["서울 강남구", "경기 성남시"])
 * @param onChange  선택 배열이 바뀔 때 호출 (새 배열 전달)
 * @param onClose   패널 닫기
 */
export default function RegionMultiPicker({ selected = [], onChange, onClose }) {
  const sidoData = (sido) => REGIONS[sido]
  const isFlat   = (sido) => Array.isArray(sidoData(sido))

  const [selectedSido, setSelectedSido]       = useState(SIDO_LIST[0])
  const [selectedSigungu, setSelectedSigungu] = useState(null)

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

  // 최종 지역 문자열을 선택 목록에 토글
  const toggle = (region) => {
    onChange(
      selected.includes(region)
        ? selected.filter(r => r !== region)
        : [...selected, region]
    )
  }

  const handleSido = (sido) => {
    setSelectedSido(sido)
    setSelectedSigungu(null)
  }

  // 시/군 클릭 — 하위 구가 없으면 바로 토글, 있으면 패널 전환
  const handleSigungu = (sigungu) => {
    const subs = sidoData(selectedSido)[sigungu]
    if (!subs || subs.length === 0) {
      toggle(`${selectedSido} ${sigungu}`)
    } else {
      setSelectedSigungu(sigungu)
    }
  }

  const handleGu     = (gu) => toggle(`${selectedSido} ${selectedSigungu} ${gu}`)
  const handleFlatGu = (gu) => toggle(`${selectedSido} ${gu}`)

  const flat = isFlat(selectedSido)
  const sigunguData = !flat ? sidoData(selectedSido) : null
  const guList = selectedSigungu ? sigunguData?.[selectedSigungu] : null
  const showThreePanel = !flat && selectedSigungu && guList?.length > 0

  return (
    <div className="rp-overlay">
      <div
        className={`rp-panel${showThreePanel ? ' rp-panel--wide' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="지역 선택 (다중)"
      >
        <div className="rp-header">
          <span className="rp-title">지역 선택 <span className="rp-multi-hint">중복 선택 가능</span></span>
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
                const isOn = selected.includes(full)
                return (
                  <li
                    key={gu}
                    role="option"
                    aria-selected={isOn}
                    className={`rp-sigungu-item${isOn ? ' selected' : ''}`}
                    onClick={() => handleFlatGu(gu)}
                  >
                    {gu}
                    {isOn && <span className="rp-check" aria-hidden="true">✓</span>}
                  </li>
                )
              })}
            </ul>
          ) : (
            <ul className="rp-sigungu" role="listbox">
              {Object.entries(sigunguData).map(([sg, subs]) => {
                const full = `${selectedSido} ${sg}`
                const isOn = !subs && selected.includes(full)
                const isFocused = selectedSigungu === sg
                return (
                  <li
                    key={sg}
                    role="option"
                    aria-selected={isOn}
                    className={`rp-sigungu-item${isFocused ? ' focused' : ''}${isOn ? ' selected' : ''}`}
                    onClick={() => handleSigungu(sg)}
                  >
                    <span>{sg}</span>
                    {subs?.length > 0
                      ? <span className="rp-arrow" aria-hidden="true">›</span>
                      : isOn && <span className="rp-check" aria-hidden="true">✓</span>
                    }
                  </li>
                )
              })}
            </ul>
          )}

          {/* 3열: 구 (시/군 아래 구가 있을 때) */}
          {showThreePanel && (
            <ul className="rp-gu" role="listbox">
              {guList.map(gu => {
                const full = `${selectedSido} ${selectedSigungu} ${gu}`
                const isOn = selected.includes(full)
                return (
                  <li
                    key={gu}
                    role="option"
                    aria-selected={isOn}
                    className={`rp-sigungu-item${isOn ? ' selected' : ''}`}
                    onClick={() => handleGu(gu)}
                  >
                    {gu}
                    {isOn && <span className="rp-check" aria-hidden="true">✓</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* 하단: 선택된 지역 칩 + 완료 */}
        <div className="rp-footer">
          <div className="rp-selected-chips">
            {selected.length === 0
              ? <span className="rp-selected-empty">선택된 지역이 없어요</span>
              : selected.map(r => (
                  <button key={r} className="rp-selected-chip" onClick={() => toggle(r)}>
                    {r} <span aria-hidden="true">×</span>
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
