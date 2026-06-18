/**
 * @file systemNotify.js
 * @description 브라우저(OS) 시스템 알림 — 실시간 알림 도착 시 데스크탑 배너로도 띄운다.
 * - HTTPS 또는 localhost(보안 컨텍스트)에서만 동작. 권한 필요(요청 1회).
 * - 사이트가 열려 있을 때만 동작(완전 백그라운드 푸시는 Web Push 필요 — 범위 밖).
 */
import { openClassroomInNewTab } from '../../utils/classroomWindow.js'

/** 알림 권한 요청(default일 때만). 사용자 제스처 안에서 호출하는 게 안전. */
export function ensureNotifyPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

/**
 * 시스템 알림 표시. 권한 granted일 때만. 클릭 시 창 포커스 + 해당 경로로 이동.
 * @param {object} n 알림(notification) 객체 — { id, title, message, type, relatedId }
 * @param {(n:object)=>string|null} route type→경로 매핑 함수(notificationRoute)
 */
export function showSystemNotification(n, route) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !n) return
  try {
    const noti = new Notification(n.title || '새 알림', {
      body: n.message || '',
      tag: n.id != null ? `studyflow-noti-${n.id}` : undefined, // 같은 알림 중복 표시 방지
    })
    noti.onclick = () => {
      // 배너 클릭 → 백그라운드 탭이라도 앱 창을 앞으로.
      window.focus()
      // 강의실 열림 알림은 새 탭으로 강의실을 연다(다른 진입점과 동일, 이슈 #97)
      if (n.type === 'CLASSROOM_OPENED' && n.relatedId != null) {
        openClassroomInNewTab(n.relatedId)
        noti.close()
        return
      }
      const path = route?.(n)
      // 이 파일은 React 컴포넌트 바깥(이벤트 콜백)이라 useNavigate를 쓸 수 없어 location.hash로 이동한다.
      // 우리는 HashRouter라 location.hash 변경만으로 라우팅이 동작한다(예: '/classroom/1' → 주소 '#/classroom/1').
      // notificationRoute()는 '/...' 형태만 반환하지만, 만약 '#'가 선행돼 들어와도 '##/...'(잘못된 경로)가
      // 되지 않도록 선행 '#'를 모두 제거하고 할당한다. (브라우저가 hash 세팅 시 '#'를 자동으로 한 번 붙임)
      // 참고: 단발성 이동이라 history 스택/뒤로가기 동작은 실사용상 문제되지 않아 hash 방식을 유지한다(코드리뷰 #95).
      if (path) window.location.hash = path.replace(/^#+/, '')
      noti.close()
    }
  } catch {
    /* 일부 환경(권한/보안컨텍스트)에서 throw — 무시 */
  }
}
