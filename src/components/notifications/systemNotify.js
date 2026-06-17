/**
 * @file systemNotify.js
 * @description 브라우저(OS) 시스템 알림 — 실시간 알림 도착 시 데스크탑 배너로도 띄운다.
 * - HTTPS 또는 localhost(보안 컨텍스트)에서만 동작. 권한 필요(요청 1회).
 * - 사이트가 열려 있을 때만 동작(완전 백그라운드 푸시는 Web Push 필요 — 범위 밖).
 */

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
      window.focus()
      const path = route?.(n)
      // HashRouter — '#/...' 로 이동. route()는 '/...' 를 주지만, 혹시 '#'가 선행돼도
      // '##/...' 가 되지 않도록 선행 '#'를 제거하고 할당한다(브라우저가 '#'를 다시 붙임).
      if (path) window.location.hash = path.replace(/^#+/, '')
      noti.close()
    }
  } catch {
    /* 일부 환경(권한/보안컨텍스트)에서 throw — 무시 */
  }
}
