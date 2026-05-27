/**
 * @file ClassroomPage.jsx
 * @description 실시간 화상 수업 강의실 전체 화면입니다.
 * - 상단바, 비디오 스트립, 화이트보드, 채팅 사이드바, 하단 컨트롤을 조합합니다.
 * - 페이지 진입 시 body에 classroom-mode 클래스를 붙여 화면을 앱처럼 고정합니다.
 */
import { useEffect } from 'react'
import ClassroomTopBar from './ClassroomTopBar.jsx'
import VideoStrip from './VideoStrip.jsx'
import Whiteboard from './Whiteboard.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import BottomControls from './BottomControls.jsx'

/**
 * 강의실(화상수업) 페이지 전체.
 *
 * 그리드 레이아웃:
 *   ┌─────────────────────────────────┐
 *   │           TopBar               │
 *   ├──────┬──────────────┬──────────┤
 *   │ Video │ Whiteboard  │ Chat     │
 *   │ Strip │             │ Sidebar  │
 *   ├──────┴──────────────┴──────────┤
 *   │       Bottom Controls           │
 *   └─────────────────────────────────┘
 *
 * 페이지 마운트 시에만 body 를 풀스크린 고정(overflow:hidden)으로 만든다.
 * 언마운트되면 즉시 원상 복구 → 다른 페이지의 스크롤이 영향받지 않게.
 */
export default function ClassroomPage() {
  useEffect(() => {
    // 강의실 화면은 일반 웹페이지보다 화상회의 앱에 가까우므로
    // body에 전용 클래스를 붙여 스크롤/배경/커서 스타일을 전환합니다.
    document.body.classList.add('classroom-mode')
    return () => {
      document.body.classList.remove('classroom-mode')
    }
  }, [])

  return (
    <div className="room">
      <ClassroomTopBar />
      <main className="room-main">
        <VideoStrip />
        <Whiteboard />
        <ChatSidebar />
      </main>
      <BottomControls />
    </div>
  )
}
