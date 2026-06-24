/**
 * @file whiteboard/useWhiteboardHistory.js
 * @description 화이트보드 실행취소/다시실행 + 방향키 이동(nudge) 로직.
 *
 * 스냅샷 기반: 변경 직전 상태를 undo 스택에 쌓는다. 되돌리면 setPages가 일어나고
 * useWhiteboardSync의 flushOps가 diff를 서버로 전송해 원격까지 동기화된다.
 *
 * - beginHistory/commitHistory/cancelHistory: 드래그 동작(이동/크기/회전/지우기)처럼
 *   "시작 시 보류 → 실제 변경됐을 때만 커밋"하는 흐름용. (포인터 핸들러가 사용)
 * - pushUndo: 단발 변경(텍스트 추가, 색 변경, 삭제 등) 직전에 직접 한 번 쌓는 용도.
 * - movedRef: 이번 드래그에서 실제 변경이 있었는지. 포인터 핸들러와 공유하므로 반환한다.
 */
import { useRef } from 'react'
import { snapPages } from './syncState.js'
import { translate } from './geometry.js'

const HISTORY_MAX = 60

export function useWhiteboardHistory({
  pagesRef,
  setPages,
  setShapes,
  selRef,
  setSelectedIds,
  setEditing,
  setDraft,
  setCurveHover,
  pushUndoRef,
}) {
  const undoRef = useRef([])         // 과거 스냅샷(되돌릴 상태들)
  const redoRef = useRef([])         // 다시실행 스냅샷들
  const histBeforeRef = useRef(null) // 드래그 동작 시작 전 보류 스냅샷(변경 확정 시 커밋)
  const movedRef = useRef(false)     // 이번 드래그에서 실제 변경(이동/크기/회전/지우기)이 있었나
  const arrowTsRef = useRef(0)       // 방향키 연속 이동 묶음용 타임스탬프

  const pushUndo = (snap) => { undoRef.current.push(snap); if (undoRef.current.length > HISTORY_MAX) undoRef.current.shift(); redoRef.current = [] }
  const beginHistory = () => { if (!histBeforeRef.current) histBeforeRef.current = snapPages(pagesRef.current) }
  const commitHistory = () => { if (histBeforeRef.current) { pushUndo(histBeforeRef.current); histBeforeRef.current = null } }
  const cancelHistory = () => { histBeforeRef.current = null }
  // 앞쪽 effect(clearNonce/color 등)에서 호출할 수 있도록 ref에 단발 pushUndo를 노출.
  pushUndoRef.current = () => pushUndo(snapPages(pagesRef.current))

  const resetTransientState = () => { setSelectedIds([]); setEditing(null); setDraft(null); setCurveHover(null) }
  const doUndo = () => {
    if (!undoRef.current.length) return
    redoRef.current.push(snapPages(pagesRef.current))
    const prev = undoRef.current.pop()
    resetTransientState()
    setPages(prev) // [pages] 변경 → flushOps가 diff를 서버로 전송 → 원격도 동기화
  }
  const doRedo = () => {
    if (!redoRef.current.length) return
    undoRef.current.push(snapPages(pagesRef.current))
    const next = redoRef.current.pop()
    resetTransientState()
    setPages(next)
  }
  // 방향키로 선택 도형 이동(연속 이동은 한 번의 undo로 묶음).
  const nudgeSelected = (dx, dy) => {
    const set = new Set(selRef.current); if (!set.size) return
    const now = performance.now()
    if (now - arrowTsRef.current > 700) pushUndo(snapPages(pagesRef.current)) // 연속 입력은 하나의 실행취소 단위
    arrowTsRef.current = now
    setShapes((prev) => prev.map((s) => (set.has(s.id) ? translate(s, dx, dy) : s)))
  }

  return { movedRef, pushUndo, beginHistory, commitHistory, cancelHistory, doUndo, doRedo, nudgeSelected }
}
