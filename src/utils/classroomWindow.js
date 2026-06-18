/**
 * @file classroomWindow.js
 * @description 강의실을 "새 탭"으로 여는 공용 헬퍼 (이슈 #97 — 모든 진입점 통일).
 * - 메인 런처 / 수업 페이지 "실시간 강의실" 버튼 / 알림 클릭 등에서 공통 사용.
 * - HashRouter라 #/classroom/{id}로 연다. 창 옵션을 주지 않아 팝업창이 아닌 새 탭으로 열린다.
 * - 같은 강의실은 같은 탭 이름으로 재사용(focus). 팝업 차단 시 안내.
 */
export function openClassroomInNewTab(courseId) {
  if (courseId == null) return
  // search(쿼리스트링)는 제외 — 현재 페이지 쿼리(?tab=...)가 새 탭에 전파되지 않게(origin+pathname만).
  const base = `${window.location.origin}${window.location.pathname}`
  const url = `${base}#/classroom/${courseId}`
  const win = window.open(url, `studyflow-classroom-${courseId}`)
  if (win) win.focus()
  else alert('팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.')
}
