/**
 * @file whiteboard/useWhiteboardKeyboard.js
 * @description 화이트보드 전역 키보드 단축키(window keydown) 바인딩.
 *
 * - 보기 줌/팬, 도구 전환(V·P·L·M·T·E·H·Z), 실행취소/다시실행(Ctrl+Z / Shift / Ctrl+Y),
 *   다각형 변 수 조절(↑/↓), 선택 도형 방향키 이동, 곡선 취소(Esc), 선택 삭제(Del/Backspace).
 * - 입력 폼(채팅 등)에 포커스가 있거나 텍스트 편집 중이면 무시(강의실에서 채팅과 공존하므로 충돌 방지).
 * - 판서 권한(canDraw)이 없으면 보기 도구 외 단축키는 무시.
 *
 * 의존성 배열은 [editing, canDraw]만 둔다. 나머지 함수들은 ref/setter 기반이라
 * 바인딩 시점의 참조로 동작해도 동일하게 작동한다(기존 동작 보존).
 */
import { useEffect } from 'react'
import { POLYGON_MIN, POLYGON_MAX } from './constants.js'
import { snapPages } from './syncState.js'

export function useWhiteboardKeyboard({
  editing, canDraw, onSetTool,
  toolRef, draftRef, selRef, pagesRef,
  setShapes, setSelectedIds, setDraft, setCurveHover, setPolygonSides,
  pushUndo, cancelHistory, doUndo, doRedo, nudgeSelected,
  zoomFromCenter, resetView,
}) {
  useEffect(() => {
    const onKey = (e) => {
      // 폼 요소(채팅 입력창 등)에 포커스가 있으면 화이트보드 단축키를 무시 — 강의실에 채팅과 공존하므로 충돌 방지
      const el = e.target
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (editing) return

      const mod = e.ctrlKey || e.metaKey // Windows Ctrl / Mac Cmd
      const k = (e.key || '').toLowerCase()

      if (mod && (k === '+' || k === '=')) { e.preventDefault(); zoomFromCenter(1.2); return }
      if (mod && k === '-') { e.preventDefault(); zoomFromCenter(1 / 1.2); return }
      if (mod && k === '0') { e.preventDefault(); resetView(); return }
      if (!mod && !e.altKey && k === 'h') { e.preventDefault(); onSetTool?.('hand'); return }
      if (!mod && !e.altKey && k === 'z') { e.preventDefault(); onSetTool?.(e.shiftKey ? 'zoomOut' : 'zoomIn'); return }

      if (!canDraw) return // 판서 권한 없는 참가자는 보기 도구 외 단축키를 무시(로컬 상태 분기 방지)

      // 실행취소 / 다시실행 (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y) — 브라우저 예약 아님(페이지 레벨에서 안전)
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return }
      if (mod && k === 'y') { e.preventDefault(); doRedo(); return }
      // 수정자 없는 단일 키 도구 단축키. 같은 그룹은 누를 때마다 순환 토글.
      //  V=선택 · P=펜↔형광펜 · L=직선↔곡선 · M=사각형→원→삼각형→다각형 · T=텍스트 · E=지우개
      if (!mod && !e.altKey) {
        const cur = toolRef.current
        if (k === 'v') { onSetTool?.('select'); return }
        if (k === 'p') { onSetTool?.(cur === 'pen' ? 'highlighter' : 'pen'); return }
        if (k === 'l') { onSetTool?.(cur === 'line' ? 'curve' : 'line'); return }
        if (k === 'm') { const order = ['rect', 'ellipse', 'triangle', 'polygon']; const i = order.indexOf(cur); onSetTool?.(i < 0 ? 'rect' : order[(i + 1) % order.length]); return }
        if (k === 't') { onSetTool?.('text'); return }
        if (k === 'e') { onSetTool?.('eraser'); return }
      }

      if (toolRef.current === 'polygon' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? 1 : -1
        const clamp = (v) => Math.max(POLYGON_MIN, Math.min(POLYGON_MAX, v))
        setPolygonSides((n) => clamp(n + delta))
        setDraft((d) => (d && d.type === 'polygon') ? { ...d, sides: clamp((d.sides || 5) + delta) } : d) // 그리는 중 실시간
        if (selRef.current.length) { const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) && s.type === 'polygon' ? { ...s, sides: clamp((s.sides || 5) + delta) } : s))) }
        return
      }
      // 방향키로 선택 도형 이동 (Shift=10px). 선택된 게 있을 때만.
      const NUDGE = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
      if (NUDGE[e.key] && selRef.current.length) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        nudgeSelected(NUDGE[e.key][0] * step, NUDGE[e.key][1] * step)
        return
      }
      if (e.key === 'Escape' && draftRef.current?.type === 'curve') { setDraft(null); setCurveHover(null); cancelHistory(); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selRef.current.length) {
        const set = new Set(selRef.current); pushUndo(snapPages(pagesRef.current)); setShapes((prev) => prev.filter((s) => !set.has(s.id))); setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, canDraw])
}
