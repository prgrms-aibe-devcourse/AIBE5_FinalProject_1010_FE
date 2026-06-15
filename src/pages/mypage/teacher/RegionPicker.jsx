import { useState, useEffect, useRef } from 'react'
import { REGIONS, SIDO_LIST } from '../../../data/regions.js'

/**
 * 전국 시/도 → 시/군/구 3단계 지역 선택 모달.
 *
 * REGIONS[sido] 타입에 따라 2단계/3단계 패널이 자동 전환됩니다.
 *  - 배열(string[])  : 시/도 → 구  (서울·광역시)  → "서울 강남구"
 *  - 객체({ key: null|string[] }):
 *      null    → 시/도 → 시/군  → "경기 가평군"
 *      string[] → 시/도 → 시/군 → 구  → "경기 수원시 장안구"
 */
export default function RegionPicker({ value, onChange, onClose }) {
  const sidoData = (sido) => REGIONS[sido]
  const isFlat   = (sido) => Array.isArray(sidoData(sido))

  // 현재 값에서 초기 sido/sigungu 파싱
  const initSido = () => {
    if (!value) return SIDO_LIST[0]
    return SIDO_LIST.find(s => value === s || value.startsWith(s + ' ')) ?? SIDO_LIST[0]
  }
  const initSigungu = (sido) => {
    if (!value || isFlat(sido)) return null
    const rest = value.startsWith(sido + ' ') ? value.slice(sido.length + 1) : ''
    return Object.keys(sidoData(sido)).find(sg => rest === sg || rest.startsWith(sg + ' ')) ?? null
  }

  const [selectedSido, setSelectedSido]       = useState(initSido)
  const [selectedSigungu, setSelectedSigungu] = useState(() => initSigungu(initSido()))

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

  // 시/도 변경 시 하위 선택 초기화
  const handleSido = (sido) => {
    setSelectedSido(sido)
    setSelectedSigungu(null)
  }

  // 시/군 클릭 — 구가 없으면 바로 선택, 있으면 패널 전환
  const handleSigungu = (sigungu) => {
    const subs = sidoData(selectedSido)[sigungu]
    if (!subs || subs.length === 0) {
      onChange(`${selectedSido} ${sigungu}`)
      onClose()
    } else {
      setSelectedSigungu(sigungu)
    }
  }

  // 구 클릭 — 최종 선택
  const handleGu = (gu) => {
    onChange(`${selectedSido} ${selectedSigungu} ${gu}`)
    onClose()
  }

  // 구 클릭 (flat 시/도 — 서울·광역시)
  const handleFlatGu = (gu) => {
    onChange(`${selectedSido} ${gu}`)
    onClose()
  }

  // 현재 value 파싱 → 강조 표시용
  const currentParts = value?.split(' ') ?? []
  const currentSido     = currentParts[0]
  const currentSigungu  = currentParts[1]
  const currentGu       = currentParts[2]

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
        aria-label="지역 선택"
      >
        <div className="rp-header">
          <span className="rp-title">지역 선택</span>
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
              {sidoData(selectedSido).map(gu => (
                <li
                  key={gu}
                  role="option"
                  aria-selected={currentSido === selectedSido && currentSigungu === gu && !currentGu}
                  className={`rp-sigungu-item${
                    currentSido === selectedSido && currentSigungu === gu && !currentGu ? ' selected' : ''
                  }`}
                  onClick={() => handleFlatGu(gu)}
                >
                  {gu}
                  {currentSido === selectedSido && currentSigungu === gu && !currentGu && (
                    <span className="rp-check" aria-hidden="true">✓</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="rp-sigungu" role="listbox">
              {Object.entries(sigunguData).map(([sg, subs]) => {
                const isSelected = selectedSigungu === sg
                const isSaved    = currentSido === selectedSido && currentSigungu === sg && !currentGu && !subs
                return (
                  <li
                    key={sg}
                    role="option"
                    aria-selected={isSaved}
                    className={`rp-sigungu-item${isSelected ? ' focused' : ''}${isSaved ? ' selected' : ''}`}
                    onClick={() => handleSigungu(sg)}
                  >
                    <span>{sg}</span>
                    {subs?.length > 0
                      ? <span className="rp-arrow" aria-hidden="true">›</span>
                      : isSaved && <span className="rp-check" aria-hidden="true">✓</span>
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
                const isSaved = currentSido === selectedSido && currentSigungu === selectedSigungu && currentGu === gu
                return (
                  <li
                    key={gu}
                    role="option"
                    aria-selected={isSaved}
                    className={`rp-sigungu-item${isSaved ? ' selected' : ''}`}
                    onClick={() => handleGu(gu)}
                  >
                    {gu}
                    {isSaved && <span className="rp-check" aria-hidden="true">✓</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
