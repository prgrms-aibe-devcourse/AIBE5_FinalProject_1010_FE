import { useEffect, useRef, useState } from 'react'

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

// SDK를 동적으로 로드한다. autoload=false + kakao.maps.load() 조합으로 타이밍 문제 방지.
function loadSdk() {
  if (window.__kakaoSdkPromise) return window.__kakaoSdkPromise
  window.__kakaoSdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps?.LatLng) { resolve(); return }
    const s = document.createElement('script')
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`
    s.onload = () => {
      try {
        window.kakao.maps.load(() => {
          resolve()
        })
      } catch (err) {
        console.error('[KakaoMap] kakao.maps.load() 실패 — 도메인 등록 확인 필요', err)
        reject(err)
      }
    }
    s.onerror = (err) => {
      console.error('[KakaoMap] script 로드 실패 — 키 또는 네트워크 확인', err)
      reject(new Error('script load error'))
    }
    document.head.appendChild(s)
  })
  return window.__kakaoSdkPromise
}

/**
 * 카카오맵 기반 장소 선택 컴포넌트.
 *
 * @param defaultAddress  최초 표시할 주소 (선생님 프로필 지역)
 * @param onChange        { address, lat, lng } 을 부모로 전달
 */
export default function KakaoMapPicker({ defaultAddress = '', onChange }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)

  const [sdkReady,  setSdkReady]  = useState(false)
  const [sdkError,  setSdkError]  = useState(false)
  const [keyword,   setKeyword]   = useState(defaultAddress)
  const [results,   setResults]   = useState([])
  const [selected,  setSelected]  = useState(defaultAddress)

  // SDK 로드
  useEffect(() => {
    if (!KAKAO_KEY) { setSdkError(true); return }
    loadSdk().then(() => setSdkReady(true)).catch(() => setSdkError(true))
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!sdkReady || !containerRef.current) return
    const kakao = window.kakao

    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 기본값
      level: 5,
    })
    mapRef.current = map

    const marker = new kakao.maps.Marker({ map, position: map.getCenter() })
    markerRef.current = marker

    // 지도 클릭 → 역지오코딩으로 주소 획득
    kakao.maps.event.addListener(map, 'click', (e) => {
      const latlng = e.latLng
      marker.setPosition(latlng)
      const geocoder = new kakao.maps.services.Geocoder()
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (res, status) => {
        if (status !== kakao.maps.services.Status.OK) return
        const addr = res[0].road_address?.address_name ?? res[0].address?.address_name ?? ''
        applyLocation(addr, latlng.getLat(), latlng.getLng())
      })
    })

    // 기본 주소가 있으면 지오코딩해서 지도 이동
    if (defaultAddress) {
      geocodeAndMove(kakao, defaultAddress)
    }
  }, [sdkReady]) // eslint-disable-line react-hooks/exhaustive-deps

  function geocodeAndMove(kakao, addr) {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(addr, (res, status) => {
      if (status !== kakao.maps.services.Status.OK) return
      const lat = parseFloat(res[0].y)
      const lng = parseFloat(res[0].x)
      moveMarker(lat, lng)
      applyLocation(addr, lat, lng)
    })
  }

  function moveMarker(lat, lng) {
    const latlng = new window.kakao.maps.LatLng(lat, lng)
    mapRef.current?.setCenter(latlng)
    markerRef.current?.setPosition(latlng)
  }

  function applyLocation(addr, lat, lng) {
    setSelected(addr)
    setKeyword(addr)
    setResults([])
    onChange({ address: addr, lat, lng })
  }

  // 장소 검색
  function handleSearch() {
    if (!keyword.trim() || !sdkReady) return
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(keyword, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(res.slice(0, 6))
      } else {
        setResults([])
      }
    })
  }

  function selectResult(place) {
    const lat  = parseFloat(place.y)
    const lng  = parseFloat(place.x)
    const addr = place.road_address_name || place.address_name
    moveMarker(lat, lng)
    applyLocation(addr, lat, lng)
  }

  if (!KAKAO_KEY) {
    return (
      <div className="kmap-error">
        <p>⚠ <strong>VITE_KAKAO_MAP_KEY</strong> 환경변수가 설정되지 않았습니다.</p>
        <p style={{ fontSize: 12 }}>.env.local 파일에 키를 추가해주세요.</p>
      </div>
    )
  }

  if (sdkError) {
    return <div className="kmap-error">⚠ 카카오맵을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>
  }

  return (
    <div className="kmap-wrap">
      {/* 검색창 */}
      <div className="kmap-search-row">
        <input
          type="text"
          className="kmap-search-input"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          placeholder="장소나 주소를 검색하세요"
        />
        <button type="button" className="kmap-search-btn" onClick={handleSearch}>검색</button>
      </div>

      {/* 검색 결과 드롭다운 */}
      {results.length > 0 && (
        <ul className="kmap-results">
          {results.map((p, i) => (
            <li key={i} className="kmap-result-item" onClick={() => selectResult(p)}>
              <span className="kmap-result-name">{p.place_name}</span>
              <span className="kmap-result-addr">{p.road_address_name || p.address_name}</span>
            </li>
          ))}
          <li className="kmap-results-close" onClick={() => setResults([])}>닫기 ×</li>
        </ul>
      )}

      {/* 지도 */}
      <div
        ref={containerRef}
        className="kmap-container"
        style={{ opacity: sdkReady ? 1 : 0 }}
      />
      {!sdkReady && <div className="kmap-loading">지도를 불러오는 중...</div>}

      {/* 선택된 주소 */}
      {selected && (
        <p className="kmap-selected-addr">
          <span className="kmap-pin">📍</span>{selected}
        </p>
      )}
      <p className="kmap-hint">지도를 클릭하거나 검색해서 수업 장소를 선택하세요</p>
    </div>
  )
}
