/**
 * @file ClassroomPage.jsx
 * @description StudyFlow Soft Amber Studio - 실시간 강의실 메인 레이아웃 컴포넌트
 * - 밝고 따뜻한 연노랑 테마와 직관적인 인터랙션을 제공합니다.
 * - 주요 기능: 좌측 드로잉 툴바, 중앙 화이트보드, 우측 채팅창, 하단 상태 표시 컨트롤러.
 */
import { useEffect, useState } from 'react'
import ClassroomTopBar from './ClassroomTopBar.jsx'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'

export default function ClassroomPage() {
  /* 상태 관리: 모든 화상창의 가시성 및 개별 화상창의 접힘 상태 */
  const [isVideosAllVisible, setIsVideosAllVisible] = useState(true)
  const [collapsedOrbs, setCollapsedOrbs] = useState(new Set())

  /**
   * 개별 참가자 화상창(Orb)을 접거나 펼치는 토글 함수
   * @param {string} id - 참가자 고유 ID
   */
  const toggleOrb = (id) => {
    const next = new Set(collapsedOrbs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCollapsedOrbs(next)
  }

  /* 페이지 진입 시 body에 전용 스타일 클래스 부착 및 이탈 시 제거 */
  useEffect(() => {
    document.body.classList.add('classroom-mode')
    return () => {
      document.body.classList.remove('classroom-mode')
    }
  }, [])

  return (
    <div className="soft-layout fade-in">
      {/* 1. 좌측 그리기 도구 바: 펜, 도형, 색상 선택 등 수직 배치 */}
      <aside className="side-drawing-bar">
        <div className="draw-btn active" title="펜 도구">✏️</div>
        <div className="draw-btn" title="사각형">🟦</div>
        <div className="draw-btn" title="원형">⭕</div>
        <div className="draw-btn" title="텍스트 입력">T</div>
        <div className="draw-btn" title="전체 지우기">🧹</div>
        <div style={{ width: '30px', height: '1px', background: 'var(--soft-border)', margin: '12px 0' }}></div>
        {/* 색상 팔레트 데모 */}
        <div className="draw-color-circle" style={{ background: '#000' }} title="검정색"></div>
        <div className="draw-color-circle" style={{ background: '#f59e0b' }} title="앰버색"></div>
        <div className="draw-color-circle" style={{ background: '#ef4444' }} title="빨간색"></div>
      </aside>

      {/* 2. 중앙 영역: 상단 정보바 + 화이트보드(화상 오버레이 포함) + 하단 컨트롤러 */}
      <div className="soft-main">
        <ClassroomTopBar />
        
        <div className="board-shield">
          <Whiteboard />

          {/* 화이트보드 위 플로팅 화상 제어 레이어 */}
          <div className="video-toggle-container">
            {/* 마스터 토글: 모든 참가자 화상을 한꺼번에 끄거나 켬 */}
            <button 
              className="master-toggle" 
              onClick={() => setIsVideosAllVisible(!isVideosAllVisible)} 
              title={isVideosAllVisible ? '모든 화상 숨기기' : '모든 화상 보이기'}
            >
              {isVideosAllVisible ? '👁️' : '🕶️'}
            </button>
            
            {/* 전체 보기가 켜져 있을 때만 개별 오르브 표시 */}
            {isVideosAllVisible && (
              <>
                {[
                  { id: 't', label: '박선생님', icon: '👩‍🏫' },
                  { id: 'm', label: '나', icon: '🙋‍♂️' }
                ].map(p => (
                  <div key={p.id} className="p-orb-wrap">
                    {/* 개별 접기/펴기 화살표 */}
                    <div className="orb-arrow" onClick={() => toggleOrb(p.id)} title="화상창 전환">
                      {collapsedOrbs.has(p.id) ? '◀' : '▶'}
                    </div>
                    {/* 참가자 화상 버블: collapsed 상태에 따라 크기 변화 */}
                    <div className={`p-orb ${collapsedOrbs.has(p.id) ? 'collapsed' : ''}`}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                        {p.icon}
                      </div>
                      {/* 펼쳐진 상태에서만 이름표 표시 */}
                      {!collapsedOrbs.has(p.id) && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                          {p.label}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <BottomControls />
      </div>

      {/* 3. 우측 사이드바: 실시간 채팅 및 공지 사항 */}
      <ChatSidebar />
    </div>
  )
}
