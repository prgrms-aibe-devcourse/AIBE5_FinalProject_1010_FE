/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas> 오케스트레이터.
 * - 캔버스 상태(shapes/draft/selection/drag)와 포인터 핸들러를 중심으로 보유.
 * - 동기화, 페이지 이동, 미디어 추가, PDF 보정, 보조 UI는 whiteboard/* 파일로 분리.
 * - 도구: select·pen·highlighter·line·curve·rect·ellipse·triangle·polygon·text·eraser.
 */
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useCallback } from 'react'
import {
  TEXT_SIZE, HIT_PAD, HANDLE, ROT_OFFSET, ROTATE_CURSOR, BOX_TYPES, POLYGON_MIN, POLYGON_MAX, nextId,
} from './whiteboard/constants.js'
import {
  rotatePt, aabbHit, bbox, center, toLocal, corners, screenAABB,
  mapShape, translate, cloneShape, hitTest, handleAt, resizeCursor, isErased, edges,
} from './whiteboard/geometry.js'
import { paintShape } from './whiteboard/painting.js'
import OptionsBar from './whiteboard/OptionsBar.jsx'
import LayersPanel from './whiteboard/LayersPanel.jsx'
import PdfBackground from './whiteboard/PdfBackground.jsx'
import PageBar from './whiteboard/PageBar.jsx'
import { EraserCursor, MarqueeSelection, RotationHud, TextEditorOverlay, ToastBanner } from './whiteboard/Overlays.jsx'
import { pageEntriesOf, pageKindOf, pageMetaOf } from './whiteboard/pageModel.js'
import { liveAnchor, paintNameLabel } from './whiteboard/remoteLabels.js'
import { snapPages } from './whiteboard/syncState.js'
import { useWhiteboardSync } from './whiteboard/useWhiteboardSync.js'
import { useWhiteboardPages } from './whiteboard/useWhiteboardPages.js'
import { useWhiteboardMedia } from './whiteboard/useWhiteboardMedia.js'
import { usePdfPageCountGuard } from './whiteboard/usePdfPageCountGuard.js'

const Whiteboard = forwardRef(function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0, onPickSelectTool, onSetTool, sessionId = null, pageBarBottom = 12, transparent = false, canDraw = true, drawerNames = {} }, ref) {
  const canvasRef = useRef(null), ctxRef = useRef(null), wrapRef = useRef(null), inputRef = useRef(null)
  const composingRef = useRef(false)

  // 여러 페이지: 각 페이지가 자신의 shapes(도형=레이어)를 가진다. 활성 페이지만 캔버스/레이어에 표시.
  const [pages, setPages] = useState(() => [{ id: nextId(), kind: 'board', shapes: [] }])
  const [pageIndex, setPageIndex] = useState(0)
  const pageIndexRef = useRef(0)
  // 전원이 함께 보는 활성 페이지 id(서버 권위). 판서 권한자가 이동하면 전파되어 모두 같은 페이지를 본다.
  const [followPageId, setFollowPageId] = useState(null)
  const shapes = pages[pageIndex]?.shapes ?? []
  const setShapes = useCallback((updater) => {
    setPages((prev) => prev.map((pg, i) => (i === pageIndexRef.current
      ? { ...pg, shapes: typeof updater === 'function' ? updater(pg.shapes) : updater } : pg)))
  }, [])
  const [draft, setDraft] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [editing, setEditing] = useState(null)
  const [eraserCursor, setEraserCursor] = useState(null)
  const [hoverCursor, setHoverCursor] = useState('default')
  const [marquee, setMarquee] = useState(null)
  const [curveHover, setCurveHover] = useState(null)
  const [toast, setToast] = useState(null)   // 캔버스 위 인라인 알림(자동 소멸)
  const [layersOpen, setLayersOpen] = useState(true)
  const [dragLayer, setDragLayer] = useState(null)
  const [panelPos, setPanelPos] = useState(null)
  const panelRef = useRef(null)
  const [degText, setDegText] = useState('0')
  const degFocus = useRef(false)
  const [pdfPageInput, setPdfPageInput] = useState('1')
  const pdfPageInputFocusRef = useRef(false)

  const [strokeWidth, setStrokeWidth] = useState(3)
  const [opacity, setOpacity] = useState(1)
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(TEXT_SIZE)
  const [bold, setBold] = useState(false)
  const [polygonSides, setPolygonSides] = useState(5)

  const drag = useRef(null)
  const eraseRadius = Math.max(6, strokeWidth)
  const shapesRef = useRef(shapes), draftRef = useRef(draft), selRef = useRef(selectedIds)
  const toolRef = useRef(tool), colorRef = useRef(color), widthRef = useRef(strokeWidth), opacityRef = useRef(opacity)
  const eraseRadiusRef = useRef(eraseRadius), curveHoverRef = useRef(curveHover), polygonSidesRef = useRef(polygonSides)
  const remoteLiveRef = useRef({})       // 원격 참가자의 그리는 중 미리보기: senderId -> { shape, pageId }
  const drawerNamesRef = useRef(drawerNames) // senderId(userId) -> 표시명 (그리는 중 이름 라벨용, 이슈 #100)
  const pushUndoRef = useRef(null)           // 단발 변경 직전 스냅샷을 undo에 쌓는 함수(앞쪽 effect에서 호출용)
  const activePageIdRef = useRef(null)   // 현재 보고 있는 페이지 id (라이브 미리보기 페이지 매칭용)
  const lastWhiteboardPageIdRef = useRef(null)
  const lastPdfPageIdRef = useRef(null)
  // PDF 페이지 수 보정은 같은 문서를 계속 fetch하지 않도록 1회성으로 막는다.
  // 단, 이전 버전에서 잘못 저장된 pageCount가 바뀌는 경우는 다시 검사해야 하므로 key에 pageCount도 포함한다.
  const pdfCountCheckedRef = useRef(new Set())
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { pageIndexRef.current = pageIndex }, [pageIndex])
  // resync 등으로 페이지 수가 줄면 현재 인덱스가 범위를 벗어날 수 있으니 보정
  useEffect(() => { if (pageIndex >= pages.length) setPageIndex(Math.max(0, pages.length - 1)) }, [pages, pageIndex])
  // 인라인 알림 자동 소멸
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])
  useEffect(() => { activePageIdRef.current = pages[pageIndex]?.id ?? null }, [pages, pageIndex])
  useEffect(() => {
    const page = pages[pageIndex]
    if (!page) return
    if (pageKindOf(page) === 'pdf') lastPdfPageIdRef.current = page.id
    else lastWhiteboardPageIdRef.current = page.id
  }, [pages, pageIndex])
  useEffect(() => {
    if (pdfPageInputFocusRef.current) return
    const meta = pageMetaOf(pages[pageIndex])
    if (meta.kind === 'pdf') setPdfPageInput(String(Math.max(1, Number(meta.pdfPage) || 1)))
  }, [pages, pageIndex])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedIds }, [selectedIds])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])
  useEffect(() => { curveHoverRef.current = curveHover }, [curveHover])
  useEffect(() => { polygonSidesRef.current = polygonSides }, [polygonSides])
  // 이름 맵이 바뀌면 ref 갱신 후 다시 그려 라벨을 최신 이름으로 반영
  useEffect(() => { drawerNamesRef.current = drawerNames; redraw() }, [drawerNames]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSel = (ids) => setSelectedIds(ids)
  const ctx = () => ctxRef.current

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, c = ctxRef.current
    if (!canvas || !c) return
    c.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(c, s)
    if (draftRef.current) { let d = draftRef.current; if (d.type === 'curve' && curveHoverRef.current) d = { ...d, points: [...d.points, curveHoverRef.current] }; paintShape(c, d) }
    // 원격 참가자가 그리는 중인 도형(라이브 미리보기) — 현재 페이지 것만. 그 위에 작성자 이름 라벨(이슈 #100).
    const curPageId = activePageIdRef.current
    Object.entries(remoteLiveRef.current).forEach(([senderId, lv]) => {
      if (!lv || !lv.shape || lv.pageId !== curPageId) return
      paintShape(c, lv.shape)
      const name = drawerNamesRef.current[String(senderId)]
      if (name) {
        const a = liveAnchor(lv.shape)        // 현재 펜 끝에 라벨을 붙여 포인터를 따라가게
        paintNameLabel(c, name, a.x + 8, a.y) // 펜 끝 살짝 우측 위
      }
    })
    const ids = selRef.current
    ids.forEach((id) => {
      const sel = shapesRef.current.find((s) => s.id === id)
      if (!sel) return
      const b = bbox(sel, c), rot = sel.rotation || 0, ce = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
      c.save()
      if (rot) { c.translate(ce.x, ce.y); c.rotate(rot); c.translate(-ce.x, -ce.y) }
      c.strokeStyle = '#2563eb'; c.lineWidth = 1; c.setLineDash([5, 4])
      c.strokeRect(b.x - HIT_PAD, b.y - HIT_PAD, b.w + HIT_PAD * 2, b.h + HIT_PAD * 2); c.setLineDash([])
      if (ids.length === 1) {
        const tx = b.x + b.w / 2, ty = b.y - HIT_PAD
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - ROT_OFFSET); c.stroke()
        c.fillStyle = '#fff'; c.beginPath(); c.arc(tx, ty - ROT_OFFSET, 6, 0, Math.PI * 2); c.fill(); c.stroke()
        Object.values(corners(b)).forEach((cc) => { c.fillRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE); c.strokeRect(cc.x - HANDLE / 2, cc.y - HANDLE / 2, HANDLE, HANDLE) })
        // 변(edge) 중점 핸들 — 한 축만 크기변경
        Object.values(edges(b)).forEach((ec) => { c.fillRect(ec.x - HANDLE / 2, ec.y - HANDLE / 2, HANDLE, HANDLE); c.strokeRect(ec.x - HANDLE / 2, ec.y - HANDLE / 2, HANDLE, HANDLE) })
      }
      c.restore()
    })
  }, [])

  const fit = useCallback(() => {
    const canvas = canvasRef.current, parent = wrapRef.current
    if (!canvas || !parent) return
    const dpr = window.devicePixelRatio || 1, w = parent.clientWidth, h = parent.clientHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); ctxRef.current = c; redraw()
  }, [redraw])

  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit) }, [fit])
  useEffect(() => { redraw() }, [shapes, draft, selectedIds, marquee, curveHover, redraw])
  useEffect(() => { if (clearNonce === 0) return; pushUndoRef.current?.(); setShapes([]); setSelectedIds([]); setEditing(null); setDraft(null) }, [clearNonce])
  useEffect(() => { if (!selRef.current.length) return; pushUndoRef.current?.(); const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, color } : s))) }, [color])
  useLayoutEffect(() => {
    if (!editing) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [editing?.id, editing?.x, editing?.y])
  useEffect(() => {
    if (degFocus.current) return
    const s = selectedIds.length === 1 ? shapes.find((x) => x.id === selectedIds[0]) : null
    setDegText(s ? String((((Math.round((s.rotation || 0) * 180 / Math.PI)) % 360) + 360) % 360) : '0')
  }, [shapes, selectedIds])

  useEffect(() => {
    const onKey = (e) => {
      // 폼 요소(채팅 입력창 등)에 포커스가 있으면 화이트보드 단축키를 무시 — 강의실에 채팅과 공존하므로 충돌 방지
      const el = e.target
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (editing) return
      if (!canDraw) return // 판서 권한 없는 참가자는 단축키도 무시(로컬 상태 분기 방지)

      const mod = e.ctrlKey || e.metaKey // Windows Ctrl / Mac Cmd
      const k = (e.key || '').toLowerCase()

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

  const { pagesRef, sessionIdRef, hydrate } = useWhiteboardSync({
    pages,
    setPages,
    sessionId,
    draft,
    curveHover,
    redraw,
    activePageIdRef,
    remoteLiveRef,
    setFollowPageId,
  })

  const getPos = (e) => { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const eraseAt = (p) => setShapes((prev) => prev.filter((s) => s.hidden || !isErased(s, p, eraseRadiusRef.current, ctx())))
  const openTextEditor = (p, shape = null) => {
    drag.current = null
    setDraft(null)
    setMarquee(null)
    setCurveHover(null)
    if (shape) {
      setSel([shape.id])
      setEditing({ id: shape.id, x: shape.x, y: shape.y, value: shape.text || '' })
      return
    }
    setSel([])
    setEditing({ x: p.x, y: p.y, value: '' })
  }

  // ───────────── 실행취소/다시실행 + 변형 단축키 ─────────────
  // 스냅샷 기반: 변경 직전 상태를 undo 스택에 쌓는다. 되돌리면 setPages → flushOps가 diff를 서버로 전송해 동기화된다.
  const undoRef = useRef([])         // 과거 스냅샷(되돌릴 상태들)
  const redoRef = useRef([])         // 다시실행 스냅샷들
  const histBeforeRef = useRef(null) // 드래그 동작 시작 전 보류 스냅샷(변경 확정 시 커밋)
  const movedRef = useRef(false)     // 이번 드래그에서 실제 변경(이동/크기/회전/지우기)이 있었나
  const HISTORY_MAX = 60
  const pushUndo = (snap) => { undoRef.current.push(snap); if (undoRef.current.length > HISTORY_MAX) undoRef.current.shift(); redoRef.current = [] }
  const beginHistory = () => { if (!histBeforeRef.current) histBeforeRef.current = snapPages(pagesRef.current) }
  const commitHistory = () => { if (histBeforeRef.current) { pushUndo(histBeforeRef.current); histBeforeRef.current = null } }
  const cancelHistory = () => { histBeforeRef.current = null }
  pushUndoRef.current = () => pushUndo(snapPages(pagesRef.current)) // 앞쪽 effect(clearNonce/color 등)에서 호출
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
  const arrowTsRef = useRef(0)
  const nudgeSelected = (dx, dy) => {
    const set = new Set(selRef.current); if (!set.size) return
    const now = performance.now()
    if (now - arrowTsRef.current > 700) pushUndo(snapPages(pagesRef.current)) // 연속 입력은 하나의 실행취소 단위
    arrowTsRef.current = now
    setShapes((prev) => prev.map((s) => (set.has(s.id) ? translate(s, dx, dy) : s)))
  }

  function handleDown(e) {
    // 판서 권한 없음(학생 기본) — 그리기/선택/텍스트 시작을 모두 차단(이슈 #99). 권한은 선생님이 부여.
    if (!canDraw) return
    if (editing) {
      e.preventDefault()
      e.stopPropagation()
      inputRef.current?.blur()
      return
    }

    const p = getPos(e); const t = toolRef.current
    if (t === 'text' || tool === 'text') {
      e.preventDefault()
      e.stopPropagation()
      openTextEditor(p)
      return
    }
    if (t === 'curve') { if (!draftRef.current || draftRef.current.type !== 'curve') beginHistory(); setSel([]); setDraft((d) => (d && d.type === 'curve') ? { ...d, points: [...d.points, p] } : { id: nextId(), type: 'curve', color: colorRef.current, width: widthRef.current, opacity: opacityRef.current, points: [p] }); return }

    canvasRef.current.setPointerCapture(e.pointerId)
    movedRef.current = false
    beginHistory() // 동작 시작 전 스냅샷 보류 — 실제 변경 시 handleUp에서 커밋, 아니면 취소
    if (t === 'eraser') { setSel([]); drag.current = { mode: 'erase' }; movedRef.current = true; eraseAt(p); return }

    if (t === 'select') {
      if (selRef.current.length === 1) {
        const cur = shapesRef.current.find((s) => s.id === selRef.current[0])
        if (cur) {
          const h = handleAt(p, cur, ctx())
          if (h?.kind === 'rotate') { const ce = center(cur, ctx()); drag.current = { mode: 'rotate', cx: ce.x, cy: ce.y, start: Math.atan2(p.y - ce.y, p.x - ce.x), orig: cur.rotation || 0, id: cur.id }; return }
          if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, edge: h.edgeKey, origShape: cur, origBox: bbox(cur, ctx()), id: cur.id }; return }
        }
      }
      const id = hitTest(shapesRef.current, p, ctx())
      if (id) {
        let ids
        if (e.shiftKey) { const cur = selRef.current; ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; setSel(ids); if (!ids.includes(id)) { drag.current = null; return } }
        else { ids = selRef.current.includes(id) ? selRef.current : [id]; setSel(ids) }
        const base = ids.map((i) => shapesRef.current.find((s) => s.id === i)).filter(Boolean)
        let moveIds, orig
        if (e.ctrlKey) { const clones = base.map((b) => cloneShape(b, nextId())); setShapes((prev) => [...prev, ...clones]); moveIds = clones.map((c) => c.id); setSel(moveIds); orig = clones.map((c) => cloneShape(c, c.id)); movedRef.current = true }
        else { moveIds = ids; orig = base.map((b) => cloneShape(b, b.id)) }
        drag.current = { mode: 'move', ids: moveIds, startP: p, orig }
      } else {
        if (!e.shiftKey) setSel([])
        drag.current = { mode: 'marquee', start: p, add: e.shiftKey }
        setMarquee({ x: p.x, y: p.y, w: 0, h: 0 })
      }
      return
    }

    setSel([]); drag.current = { mode: 'draw' }
    const c = colorRef.current, w = widthRef.current, op = opacityRef.current
    if (t === 'pen') setDraft({ id: nextId(), type: 'pen', color: c, width: w, opacity: op, points: [p] })
    else if (t === 'highlighter') setDraft({ id: nextId(), type: 'pen', highlight: true, color: c, width: Math.max(w, 12), opacity: Math.min(op, 0.5), points: [p] })
    else if (t === 'line') setDraft({ id: nextId(), type: 'line', color: c, width: w, opacity: op, x1: p.x, y1: p.y, x2: p.x, y2: p.y })
    else if (t === 'rect') setDraft({ id: nextId(), type: 'rect', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'ellipse') setDraft({ id: nextId(), type: 'ellipse', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'triangle') setDraft({ id: nextId(), type: 'triangle', color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
    else if (t === 'polygon') setDraft({ id: nextId(), type: 'polygon', sides: polygonSidesRef.current, color: c, width: w, opacity: op, x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y })
  }

  function handleMove(e) {
    const p = getPos(e); const t = toolRef.current
    if (t === 'eraser') setEraserCursor(p)
    if (t === 'curve' && draftRef.current?.type === 'curve') setCurveHover(p)

    if (!drag.current) {
      if (t === 'select') {
        let cz = 'default'
        if (selRef.current.length === 1) { const cur = shapesRef.current.find((s) => s.id === selRef.current[0]); if (cur) { const h = handleAt(p, cur, ctx()); if (h?.kind === 'rotate') cz = ROTATE_CURSOR; else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey || h.edgeKey, cur.rotation); else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' } else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' }
        else if (hitTest(shapesRef.current, p, ctx())) cz = 'move'
        setHoverCursor(cz)
      }
      return
    }

    const m = drag.current.mode
    if (m === 'move' || m === 'rotate' || m === 'resize' || m === 'erase') movedRef.current = true // 실제 변경 발생 표시(handleUp에서 히스토리 커밋 판단)
    if (m === 'move') {
      let dx = p.x - drag.current.startP.x, dy = p.y - drag.current.startP.y
      if (e.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0 }
      const byId = new Map(drag.current.orig.map((o) => [o.id, o]))
      setShapes((prev) => prev.map((s) => (byId.has(s.id) ? translate(byId.get(s.id), dx, dy) : s)))
    } else if (m === 'rotate') {
      const ang = Math.atan2(p.y - drag.current.cy, p.x - drag.current.cx)
      let rotation = drag.current.orig + (ang - drag.current.start)
      if (e.shiftKey) rotation = Math.round(rotation / (Math.PI / 4)) * (Math.PI / 4)
      setShapes((prev) => prev.map((s) => (s.id === drag.current.id ? { ...s, rotation } : s)))
    } else if (m === 'resize') {
      const lp = toLocal(p, drag.current.origShape, ctx()), ob = drag.current.origBox
      let nb
      if (drag.current.edge) {
        // 변(edge) 핸들: 한 축만 변경(반대 변 고정). 가로(e/w) 또는 세로(n/s).
        const ek = drag.current.edge
        if (ek === 'e' || ek === 'w') {
          const ax = ek === 'e' ? ob.x : ob.x + ob.w
          nb = { x: Math.min(ax, lp.x), y: ob.y, w: Math.abs(lp.x - ax), h: ob.h }
        } else {
          const ay = ek === 's' ? ob.y : ob.y + ob.h
          nb = { x: ob.x, y: Math.min(ay, lp.y), w: ob.w, h: Math.abs(lp.y - ay) }
        }
      } else {
        const a = drag.current.anchor
        nb = { x: Math.min(a.x, lp.x), y: Math.min(a.y, lp.y), w: Math.abs(lp.x - a.x), h: Math.abs(lp.y - a.y) }
        if (e.shiftKey && ob.w > 0 && ob.h > 0) { const sc = Math.max(nb.w / ob.w, nb.h / ob.h), w = ob.w * sc, h = ob.h * sc, sx = lp.x >= a.x ? 1 : -1, sy = lp.y >= a.y ? 1 : -1, ox = a.x + sx * w, oy = a.y + sy * h; nb = { x: Math.min(a.x, ox), y: Math.min(a.y, oy), w, h } }
      }
      const t2 = mapShape(drag.current.origShape, drag.current.origBox, nb)
      setShapes((prev) => prev.map((s) => (s.id === t2.id ? t2 : s)))
    } else if (m === 'erase') {
      eraseAt(p)
    } else if (m === 'marquee') {
      const s0 = drag.current.start
      setMarquee({ x: Math.min(s0.x, p.x), y: Math.min(s0.y, p.y), w: Math.abs(p.x - s0.x), h: Math.abs(p.y - s0.y) })
    } else {
      const shift = e.shiftKey, ctrl = e.ctrlKey
      setDraft((d) => {
        if (!d) return d
        if (d.type === 'pen') return { ...d, points: [...d.points, p] }
        if (d.type === 'line') return { ...d, x2: p.x, y2: p.y }
        // 박스형(rect/ellipse/triangle/polygon): Shift=정비율, Ctrl=중심 기준
        const sx = d.sx ?? d.x, sy = d.sy ?? d.y
        let dw = p.x - sx, dh = p.y - sy
        if (shift) { const m = Math.max(Math.abs(dw), Math.abs(dh)); dw = dw < 0 ? -m : m; dh = dh < 0 ? -m : m }
        if (ctrl) { const aw = Math.abs(dw), ah = Math.abs(dh); return { ...d, x: sx - aw, y: sy - ah, w: 2 * aw, h: 2 * ah } }
        return { ...d, x: sx, y: sy, w: dw, h: dh }
      })
    }
  }

  function handleUp() {
    const dc = drag.current
    if (dc?.mode === 'marquee') {
      const m = marquee
      if (m && (m.w > 2 || m.h > 2)) {
        const hits = shapesRef.current.filter((s) => !s.hidden && !s.locked && s.type !== 'pdf' && aabbHit(screenAABB(s, ctx()), m)).map((s) => s.id)
        setSel(dc.add ? [...new Set([...selRef.current, ...hits])] : hits)
      }
      setMarquee(null)
      cancelHistory() // 선택(마퀴)만 — 변경 없음
    } else if (dc?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const isBox = BOX_TYPES.includes(d.type)
      const tinyBox = isBox && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (isBox) { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
      if (!tinyBox && !tinyLine) { setShapes((prev) => [...prev, d]); commitHistory() } else cancelHistory()
      setDraft(null)
    } else if (dc && (dc.mode === 'move' || dc.mode === 'resize' || dc.mode === 'rotate' || dc.mode === 'erase')) {
      if (movedRef.current) commitHistory(); else cancelHistory() // 실제 변경 있을 때만 기록
    } else {
      cancelHistory()
    }
    drag.current = null
  }

  const commitText = () => {
    const current = editing
    if (!current) return
    const raw = current.value
    const empty = !raw.trim()
    if (current.id || !empty) pushUndo(snapPages(pagesRef.current)) // 텍스트 추가/수정/삭제는 되돌릴 수 있게
    setShapes((prev) => {
      if (current.id) { if (empty) return prev.filter((s) => s.id !== current.id); return prev.map((s) => (s.id === current.id ? { ...s, text: raw } : s)) }
      if (empty) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: current.x, y: current.y, text: raw, fontFamily, fontSize, bold }]
    })
    setEditing(null)
  }
  function handleDoubleClick(e) {
    if (!canDraw) return // 판서 권한 없으면 더블클릭(텍스트 편집/곡선 종료)도 차단
    if (toolRef.current === 'curve' && draftRef.current?.type === 'curve') {
      const raw = draftRef.current.points
      const pts = raw.filter((q, i) => i === 0 || Math.hypot(q.x - raw[i - 1].x, q.y - raw[i - 1].y) > 4)
      if (pts.length >= 2) setShapes((prev) => [...prev, { ...draftRef.current, points: pts }])
      setDraft(null); setCurveHover(null); return
    }
    if (toolRef.current !== 'select') return
    const id = hitTest(shapesRef.current, getPos(e), ctx()); const s = shapesRef.current.find((x) => x.id === id)
    if (s && s.type === 'text') openTextEditor({ x: s.x, y: s.y }, s)
  }

  const applyToSelected = (patch) => { const set = new Set(selRef.current); if (set.size) setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, ...patch } : s))) }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }
  const applyDeg = (text) => { const n = parseFloat(text); if (Number.isFinite(n)) applyToSelected({ rotation: (n * Math.PI) / 180 }) }

  const {
    clearTransient,
    broadcastActivePage,
    prevPage,
    nextPage,
    commitPdfPageInput,
    prevPdfPage,
    nextPdfPage,
    goToWhiteboard,
    goToPdf,
    addPage,
  } = useWhiteboardPages({
    canDraw,
    followPageId,
    pages,
    pagesRef,
    pageIndexRef,
    sessionIdRef,
    setPageIndex,
    setPages,
    setFollowPageId,
    setSelectedIds,
    setDraft,
    setEditing,
    setMarquee,
    setCurveHover,
    dragRef: drag,
    lastWhiteboardPageIdRef,
    lastPdfPageIdRef,
    pdfPageInput,
    setPdfPageInput,
  })

  const { addImages, addPdf } = useWhiteboardMedia({
    canDraw,
    pageIndexRef,
    pagesRef,
    setPages,
    setShapes,
    setSel,
    pushUndo,
    clearTransient,
    broadcastActivePage,
    onPickSelectTool,
    setToast,
  })
  useImperativeHandle(ref, () => ({ addImages, addPdf }))

  // 레이어 동작
  const onPickLayer = (e, id, isText) => {
    if (e.shiftKey) { const cur = selRef.current; setSel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) }
    else setSel([id])
    onPickSelectTool?.()
    if (isText) { const s = shapesRef.current.find((x) => x.id === id); if (s) openTextEditor({ x: s.x, y: s.y }, s) }
  }
  const deleteLayer = (id) => { pushUndo(snapPages(pagesRef.current)); setShapes((prev) => prev.filter((s) => s.id !== id)); setSel(selRef.current.filter((x) => x !== id)) }
  const toggleHidden = (id) => { pushUndo(snapPages(pagesRef.current)); setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))) }
  const dropLayer = (targetId) => {
    const from = dragLayer; setDragLayer(null)
    if (!from || from === targetId) return
    pushUndo(snapPages(pagesRef.current))
    setShapes((prev) => { const arr = prev.slice(); const fi = arr.findIndex((s) => s.id === from), ti = arr.findIndex((s) => s.id === targetId); if (fi < 0 || ti < 0) return prev; const [mv] = arr.splice(fi, 1); arr.splice(ti, 0, mv); return arr })
  }
  // 패널 헤더를 누르고 있는 동안만 이동 (보드 영역 안으로 제한)
  const onPanelDown = (e) => {
    const el = panelRef.current
    if (!el) return
    e.preventDefault()
    const start = { sx: e.clientX, sy: e.clientY, left: el.offsetLeft, top: el.offsetTop }
    const move = (ev) => {
      const wrap = wrapRef.current
      let left = start.left + (ev.clientX - start.sx), top = start.top + (ev.clientY - start.sy)
      if (wrap && el) { left = Math.max(0, Math.min(left, wrap.clientWidth - el.offsetWidth)); top = Math.max(0, Math.min(top, wrap.clientHeight - el.offsetHeight)) }
      setPanelPos({ left, top })
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // 옵션 표시 제어:
  //  - 지우개: 투명도 숨김(굵기=지우개 크기는 표시)
  //  - 텍스트(도구/선택): 굵기 숨김(글자 크기 px로 조절하므로 stroke 폭 무의미)
  //  - 사진(선택): 굵기 숨김(이미지는 stroke 폭 무의미)
  const typeOf = (id) => shapes.find((s) => s.id === id)?.type
  const selAllImage = selectedIds.length > 0 && selectedIds.every((id) => typeOf(id) === 'image')
  const selAllText = selectedIds.length > 0 && selectedIds.every((id) => typeOf(id) === 'text')
  const showWidth = tool !== 'text' && !selAllImage && !selAllText
  const showOpacity = tool !== 'eraser'
  const currentPage = pages[pageIndex]
  const currentPageMeta = pageMetaOf(currentPage)
  const activePdf = currentPageMeta.kind === 'pdf'
    ? {
      pdfDocId: currentPageMeta.pdfDocId,
      pdfPage: currentPageMeta.pdfPage || 1,
      pageCount: currentPageMeta.pdfPageCount || 1,
      src: currentPageMeta.pdfSrc,
      fileName: currentPageMeta.fileName,
    }
    : null
  const pageEntries = pageEntriesOf(pages)
  const boardPageEntries = pageEntries.filter((entry) => !entry.pdf)
  const pdfPageEntries = pageEntries.filter((entry) => entry.pdf)
  const currentBoardIndex = boardPageEntries.findIndex((entry) => entry.page.id === currentPage?.id)
  const currentPdfPageNo = activePdf ? Math.max(1, Number(activePdf.pdfPage) || 1) : 0
  const currentPdfPageCount = activePdf ? Math.max(currentPdfPageNo, Number(activePdf.pageCount) || 1) : 0
  const hasPdf = pdfPageEntries.length > 0

  usePdfPageCountGuard({ activePdf, canDraw, checkedRef: pdfCountCheckedRef, setPages })

  const baseCursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'select' ? hoverCursor : 'crosshair'
  let rotHud = null
  if (selectedIds.length === 1 && tool === 'select' && ctxRef.current) {
    const s = shapes.find((x) => x.id === selectedIds[0])
    if (s) { const b = bbox(s, ctxRef.current), ce = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; rotHud = rotatePt(b.x + b.w / 2, b.y - HIT_PAD - ROT_OFFSET, ce.x, ce.y, s.rotation || 0) }
  }
  const handlePdfPageFocus = (e) => { pdfPageInputFocusRef.current = true; e.currentTarget.select() }
  const handlePdfPageBlur = () => { pdfPageInputFocusRef.current = false; commitPdfPageInput() }
  const handlePdfPageChange = (e) => setPdfPageInput(e.target.value.replace(/\D/g, '').slice(0, 4))
  const handlePdfPageKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') { e.preventDefault(); commitPdfPageInput(); e.currentTarget.blur() }
    if (e.key === 'Escape') { e.preventDefault(); setPdfPageInput(String(currentPdfPageNo)); e.currentTarget.blur() }
  }
  const handleDegFocus = () => { degFocus.current = true }
  const handleDegBlur = () => { degFocus.current = false }
  const handleDegChange = (e) => { setDegText(e.target.value); applyDeg(e.target.value) }

  return (
    <div ref={wrapRef} style={{ height: '100%', background: transparent ? 'transparent' : '#fff', position: 'relative' }}>
      <PdfBackground activePdf={activePdf} transparent={transparent} />
      <ToastBanner toast={toast} />

      <OptionsBar
        tool={tool} strokeWidth={strokeWidth} onWidth={onWidth} opacity={opacity} onOpacity={onOpacity}
        fontFamily={fontFamily} setFontFamily={setFontFamily} fontSize={fontSize} setFontSize={setFontSize}
        bold={bold} setBold={setBold} polygonSides={polygonSides} setPolygonSides={setPolygonSides}
        showWidth={showWidth} showOpacity={showOpacity}
      />

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 2, touchAction: 'none', cursor: canDraw ? baseCursor : 'not-allowed' }}
        onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }} onDoubleClick={handleDoubleClick} />

      <PageBar
        activePdf={activePdf}
        pageBarBottom={pageBarBottom}
        canDraw={canDraw}
        boardPageEntries={boardPageEntries}
        currentBoardIndex={currentBoardIndex}
        hasPdf={hasPdf}
        goToWhiteboard={goToWhiteboard}
        goToPdf={goToPdf}
        prevPage={prevPage}
        nextPage={nextPage}
        addPage={addPage}
        pdfPageInput={pdfPageInput}
        onPdfPageFocus={handlePdfPageFocus}
        onPdfPageBlur={handlePdfPageBlur}
        onPdfPageChange={handlePdfPageChange}
        onPdfPageKeyDown={handlePdfPageKeyDown}
        currentPdfPageNo={currentPdfPageNo}
        currentPdfPageCount={currentPdfPageCount}
        prevPdfPage={prevPdfPage}
        nextPdfPage={nextPdfPage}
      />

      <MarqueeSelection marquee={marquee} />
      <EraserCursor show={tool === 'eraser'} eraserCursor={eraserCursor} eraseRadius={eraseRadius} />

      <LayersPanel
        shapes={shapes} selectedIds={selectedIds} open={layersOpen} setOpen={setLayersOpen}
        panelRef={panelRef} panelPos={panelPos} onPanelDown={onPanelDown}
        onPick={onPickLayer} onToggleHidden={toggleHidden} onDelete={deleteLayer}
        onDragStartLayer={setDragLayer} onDropLayer={dropLayer}
      />

      <RotationHud
        rotHud={rotHud}
        degText={degText}
        onFocus={handleDegFocus}
        onBlur={handleDegBlur}
        onChange={handleDegChange}
      />
      <TextEditorOverlay
        editing={editing}
        inputRef={inputRef}
        composingRef={composingRef}
        setEditing={setEditing}
        commitText={commitText}
        bold={bold}
        fontSize={fontSize}
        fontFamily={fontFamily}
        color={color}
      />
    </div>
  )
})

export default Whiteboard
