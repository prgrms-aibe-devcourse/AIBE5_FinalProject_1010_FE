/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas> 오케스트레이터.
 * - 상태(shapes/draft/selection/drag)와 포인터 핸들러만 보유.
 * - 순수 로직은 whiteboard/{constants,geometry,painting}.js, UI는 whiteboard/{OptionsBar,LayersPanel}.jsx로 분리.
 * - 도구: select·pen·highlighter·line·curve·rect·ellipse·triangle·polygon·text·eraser.
 * - 로컬 전용(실시간 공유는 후속).
 */
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useCallback } from 'react'
import {
  TEXT_SIZE, HIT_PAD, HANDLE, ROT_OFFSET, ROTATE_CURSOR, BOX_TYPES, POLYGON_MIN, POLYGON_MAX, nextId,
} from './whiteboard/constants.js'
import {
  rotatePt, aabbHit, bbox, center, toLocal, corners, screenAABB,
  mapShape, translate, cloneShape, hitTest, handleAt, resizeCursor, isErased,
} from './whiteboard/geometry.js'
import { paintShape } from './whiteboard/painting.js'
import OptionsBar from './whiteboard/OptionsBar.jsx'
import LayersPanel from './whiteboard/LayersPanel.jsx'
import { connectChat, subscribeWhiteboard, sendWhiteboard, onSocketStatus } from '../../api/chatSocket.js'
import { fetchWhiteboardSnapshot } from '../../api/classroomApi.js'
import { getCurrentUserId } from '../../auth/currentUser.js'
import { uploadImage, prepareImageForUpload, toAbsoluteFileUrl } from '../../api/fileApi.js'

const Whiteboard = forwardRef(function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0, onPickSelectTool, sessionId = null, pageBarBottom = 12 }, ref) {
  const canvasRef = useRef(null), ctxRef = useRef(null), wrapRef = useRef(null), inputRef = useRef(null)
  const composingRef = useRef(false)

  // 여러 페이지: 각 페이지가 자신의 shapes(도형=레이어)를 가진다. 활성 페이지만 캔버스/레이어에 표시.
  const [pages, setPages] = useState(() => [{ id: nextId(), shapes: [] }])
  const [pageIndex, setPageIndex] = useState(0)
  const pageIndexRef = useRef(0)
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
  const activePageIdRef = useRef(null)   // 현재 보고 있는 페이지 id (라이브 미리보기 페이지 매칭용)
  const liveLastRef = useRef(0)          // 라이브 전송 throttle 타임스탬프
  const liveSentNullRef = useRef(false)  // draft 없을 때 'live:null'을 한 번만 보내도록 가드
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { pageIndexRef.current = pageIndex }, [pageIndex])
  // resync 등으로 페이지 수가 줄면 현재 인덱스가 범위를 벗어날 수 있으니 보정
  useEffect(() => { if (pageIndex >= pages.length) setPageIndex(Math.max(0, pages.length - 1)) }, [pages, pageIndex])
  // 인라인 알림 자동 소멸
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])
  useEffect(() => { activePageIdRef.current = pages[pageIndex]?.id ?? null }, [pages, pageIndex])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selRef.current = selectedIds }, [selectedIds])
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { widthRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { eraseRadiusRef.current = eraseRadius }, [eraseRadius])
  useEffect(() => { curveHoverRef.current = curveHover }, [curveHover])
  useEffect(() => { polygonSidesRef.current = polygonSides }, [polygonSides])

  const setSel = (ids) => setSelectedIds(ids)
  const ctx = () => ctxRef.current

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, c = ctxRef.current
    if (!canvas || !c) return
    c.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(c, s)
    if (draftRef.current) { let d = draftRef.current; if (d.type === 'curve' && curveHoverRef.current) d = { ...d, points: [...d.points, curveHoverRef.current] }; paintShape(c, d) }
    // 원격 참가자가 그리는 중인 도형(라이브 미리보기) — 현재 페이지 것만
    const curPageId = activePageIdRef.current
    Object.values(remoteLiveRef.current).forEach((lv) => { if (lv && lv.shape && lv.pageId === curPageId) paintShape(c, lv.shape) })
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
  useEffect(() => { if (clearNonce === 0) return; setShapes([]); setSelectedIds([]); setEditing(null); setDraft(null) }, [clearNonce])
  useEffect(() => { if (!selRef.current.length) return; const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, color } : s))) }, [color])
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
      if (toolRef.current === 'polygon' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? 1 : -1
        const clamp = (v) => Math.max(POLYGON_MIN, Math.min(POLYGON_MAX, v))
        setPolygonSides((n) => clamp(n + delta))
        setDraft((d) => (d && d.type === 'polygon') ? { ...d, sides: clamp((d.sides || 5) + delta) } : d) // 그리는 중 실시간
        if (selRef.current.length) { const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) && s.type === 'polygon' ? { ...s, sides: clamp((s.sides || 5) + delta) } : s))) }
        return
      }
      if (e.key === 'Escape' && draftRef.current?.type === 'curve') { setDraft(null); setCurveHover(null); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selRef.current.length) {
        const set = new Set(selRef.current); setShapes((prev) => prev.filter((s) => !set.has(s.id))); setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  // ───────────── 실시간 동기화 (#131, 서버 권위 방식) ─────────────
  // 로컬 변경은 op로 diff해 서버로 전송 → 서버가 권위 상태에 반영하고 seq를 붙여 전원에게 재방송.
  // 수신측은 seq를 순서대로 적용하고, 구멍(유실/재연결)이 나면 REST로 전체 상태를 다시 받아 자가 치유한다.
  const myIdRef = useRef(getCurrentUserId())  // 내 userId — 마운트 시 1회만 읽어 고정(echo 무시 판정용)
  const pagesRef = useRef(pages)
  const sessionIdRef = useRef(sessionId)
  const prevSentRef = useRef(new Map())      // pageId -> { ref, map(id->shape) } : 마지막으로 "전송됐다고 아는" 상태(기준선)
  const lastSeqRef = useRef(0)               // 마지막으로 적용한 서버 순번 — 다음은 +1이어야 함(아니면 구멍 → resync)
  const resyncingRef = useRef(false)         // 전체 재동기화 진행 중(중복 호출 방지)
  const opTimerRef = useRef(null)
  useEffect(() => { pagesRef.current = pages }, [pages])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  // 직렬화: _img(비직렬화) 제거. update는 image src(base64) 생략(원격이 add 때 받은 것 유지).
  const serShape = (s, isUpdate) => ({ ...s, _img: undefined, src: isUpdate ? undefined : s.src })
  // 역직렬화: 이미지면 base64 src로 _img 복원(로드되면 redraw).
  const hydrate = (s) => {
    if (s.type === 'image' && s.src && !s._img) { const img = new Image(); img.onload = () => redraw(); img.src = s.src; return { ...s, _img: img } }
    return s
  }
  const buildPrev = (pgs) => new Map(pgs.map((pg) => [pg.id, { ref: pg.shapes, map: new Map(pg.shapes.map((s) => [s.id, s])) }]))

  // 원격 op를 페이지 배열에 적용한 새 배열을 반환(순수 함수). 송신/수신 양쪽에서 동일 규칙으로 사용.
  const applyOps = (prevPages, ops) => {
    let next = prevPages
    for (const o of ops) {
      if (o.op === 'addPage') { if (!next.find((p) => p.id === o.pageId)) next = [...next, { id: o.pageId, shapes: [] }] }
      else if (o.op === 'removePage') next = next.filter((p) => p.id !== o.pageId)
      else next = next.map((p) => {
        if (p.id !== o.pageId) return p
        if (o.op === 'add') return p.shapes.some((s) => s.id === o.shape.id) ? p : { ...p, shapes: [...p.shapes, hydrate(o.shape)] }
        if (o.op === 'update') return { ...p, shapes: p.shapes.map((s) => (s.id === o.shape.id ? hydrate({ ...s, ...o.shape }) : s)) }
        if (o.op === 'remove') return { ...p, shapes: p.shapes.filter((s) => s.id !== o.id) }
        if (o.op === 'clear') return { ...p, shapes: [] }
        if (o.op === 'reorder') { const m = new Map(p.shapes.map((s) => [s.id, s])); return { ...p, shapes: o.ids.map((id) => m.get(id)).filter(Boolean) } }
        return p
      })
    }
    return next
  }

  const flushOps = () => {
    if (sessionIdRef.current == null) return
    const cur = pagesRef.current
    const prev = prevSentRef.current, ops = [], seen = new Set()
    cur.forEach((pg) => {
      seen.add(pg.id)
      const p = prev.get(pg.id)
      if (!p) { ops.push({ op: 'addPage', pageId: pg.id }); pg.shapes.forEach((s) => ops.push({ op: 'add', pageId: pg.id, shape: serShape(s, false) })); return }
      if (p.ref === pg.shapes) return
      const curMap = new Map(pg.shapes.map((s) => [s.id, s]))
      pg.shapes.forEach((s) => { if (!p.map.has(s.id)) ops.push({ op: 'add', pageId: pg.id, shape: serShape(s, false) }); else if (p.map.get(s.id) !== s) ops.push({ op: 'update', pageId: pg.id, shape: serShape(s, true) }) })
      p.map.forEach((_, id) => { if (!curMap.has(id)) ops.push({ op: 'remove', pageId: pg.id, id }) })
      const curOrder = pg.shapes.map((s) => s.id).join(','), prevOrder = [...p.map.keys()].join(',')
      if (curOrder !== prevOrder && pg.shapes.length === p.map.size) ops.push({ op: 'reorder', pageId: pg.id, ids: pg.shapes.map((s) => s.id) })
    })
    prev.forEach((_, pageId) => { if (!seen.has(pageId)) ops.push({ op: 'removePage', pageId }) })
    // 기준선을 현재 상태로 갱신 — 원격 적용분도 applyRemote에서 이미 기준선에 반영되므로 여기선 로컬 변경만 op로 잡힌다.
    prevSentRef.current = buildPrev(cur)
    if (ops.length) sendWhiteboard(sessionIdRef.current, { type: 'ops', ops })
  }

  // 로컬 변경 → op 전송(50ms 코얼레싱). 서버가 권위 상태를 보관하므로 클라 스냅샷 저장은 더 이상 없음.
  useEffect(() => {
    if (sessionId == null) return
    if (!opTimerRef.current) opTimerRef.current = setTimeout(() => { opTimerRef.current = null; flushOps() }, 50)
  }, [pages, sessionId])

  // 그리는 중(draft)인 도형을 throttle(~45ms)로 라이브 전송 → 원격에서 펜 스트로크가 실시간으로 보임.
  // draft가 비면(확정/취소) 미리보기 제거 메시지를 "한 번만" 전송한다.
  // (curveHover는 커서 이동마다 바뀌므로, 그리지 않는 동안에도 null이 반복 전송되지 않도록 ref로 가드)
  useEffect(() => {
    if (sessionId == null) return
    if (!draft) {
      if (!liveSentNullRef.current) {
        sendWhiteboard(sessionIdRef.current, { type: 'live', shape: null })
        liveSentNullRef.current = true
      }
      return
    }
    liveSentNullRef.current = false
    const now = performance.now()
    if (now - liveLastRef.current < 45) return
    liveLastRef.current = now
    let d = draft
    if (d.type === 'curve' && curveHover) d = { ...d, points: [...d.points, curveHover] }
    sendWhiteboard(sessionIdRef.current, { type: 'live', shape: { ...d, _img: undefined }, pageId: activePageIdRef.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, curveHover, sessionId])

  // 전체 재동기화: 서버 권위 상태를 통째로 다시 받아 화면을 맞춘다(최초 입장 + seq 구멍/재연결 복구).
  const resync = () => {
    const sid = sessionIdRef.current
    if (sid == null || resyncingRef.current) return
    resyncingRef.current = true
    fetchWhiteboardSnapshot(sid).then((res) => {
      const board = res?.board
      if (!board) return
      const loaded = (board.pages || []).map((pg) => ({ id: pg.id, shapes: (pg.shapes || []).map(hydrate) }))
      lastSeqRef.current = board.seq || 0
      prevSentRef.current = buildPrev(loaded)   // 받은 상태를 기준선으로 — 그대로 되돌려 보내지 않게
      setPages(loaded.length ? loaded : [{ id: 'p1', shapes: [] }])
    }).catch(() => {}).finally(() => { resyncingRef.current = false })
  }

  const applyRemote = (msg) => {
    if (!msg) return
    // 그리는 중 미리보기(라이브) — 휘발성. 내 것/순번 없음. 남의 것만 임시 렌더.
    if (msg.type === 'live') {
      if (msg.senderId === myIdRef.current) return
      if (msg.shape) remoteLiveRef.current[msg.senderId] = { shape: hydrate(msg.shape), pageId: msg.pageId }
      else delete remoteLiveRef.current[msg.senderId]
      redraw()
      return
    }
    if (msg.type !== 'ops' || !Array.isArray(msg.ops)) return

    // 순번 검사: 반드시 lastSeq+1이어야 한다. 이미 본 것은 무시, 구멍이 나면 전체 재동기화.
    const seq = msg.seq
    if (seq != null) {
      if (seq <= lastSeqRef.current) return
      if (seq !== lastSeqRef.current + 1) { resync(); return }
      lastSeqRef.current = seq
    }
    // 내 변경은 이미 로컬에 낙관적으로 반영됨 — 순번만 위에서 전진시키고 다시 적용하지 않는다.
    if (msg.senderId === myIdRef.current) return

    delete remoteLiveRef.current[msg.senderId] // 확정됐으면 그 사람의 미리보기 제거
    setPages((prevPages) => {
      const next = applyOps(prevPages, msg.ops)
      // 원격 적용 결과를 "전송 기준선"에도 반영 → 다음 flushOps가 이 변경을 다시 브로드캐스트하지 않는다.
      prevSentRef.current = buildPrev(next)
      return next
    })
  }

  // 입장/재연결: 채널 구독 후 곧바로 전체 상태 동기화.
  // (연결될 때마다 재구독 + resync — 끊겼다 붙으면 놓친 변경을 서버 권위 상태로 복구한다)
  useEffect(() => {
    if (sessionId == null) return
    let cancelled = false, unsub = () => {}
    const onConn = () => {
      if (cancelled) return
      unsub(); unsub = subscribeWhiteboard(sessionId, applyRemote)
      resync()
    }
    const off = onSocketStatus((s) => { if (s === 'connected') onConn() })
    connectChat().then(onConn).catch(() => {})
    return () => { cancelled = true; unsub(); off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

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

  function handleDown(e) {
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
    if (t === 'curve') { setSel([]); setDraft((d) => (d && d.type === 'curve') ? { ...d, points: [...d.points, p] } : { id: nextId(), type: 'curve', color: colorRef.current, width: widthRef.current, opacity: opacityRef.current, points: [p] }); return }

    canvasRef.current.setPointerCapture(e.pointerId)
    if (t === 'eraser') { setSel([]); drag.current = { mode: 'erase' }; eraseAt(p); return }

    if (t === 'select') {
      if (selRef.current.length === 1) {
        const cur = shapesRef.current.find((s) => s.id === selRef.current[0])
        if (cur) {
          const h = handleAt(p, cur, ctx())
          if (h?.kind === 'rotate') { const ce = center(cur, ctx()); drag.current = { mode: 'rotate', cx: ce.x, cy: ce.y, start: Math.atan2(p.y - ce.y, p.x - ce.x), orig: cur.rotation || 0, id: cur.id }; return }
          if (h?.kind === 'resize') { drag.current = { mode: 'resize', anchor: h.anchor, origShape: cur, origBox: bbox(cur, ctx()), id: cur.id }; return }
        }
      }
      const id = hitTest(shapesRef.current, p, ctx())
      if (id) {
        let ids
        if (e.shiftKey) { const cur = selRef.current; ids = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; setSel(ids); if (!ids.includes(id)) { drag.current = null; return } }
        else { ids = selRef.current.includes(id) ? selRef.current : [id]; setSel(ids) }
        const base = ids.map((i) => shapesRef.current.find((s) => s.id === i)).filter(Boolean)
        let moveIds, orig
        if (e.ctrlKey) { const clones = base.map((b) => cloneShape(b, nextId())); setShapes((prev) => [...prev, ...clones]); moveIds = clones.map((c) => c.id); setSel(moveIds); orig = clones.map((c) => cloneShape(c, c.id)) }
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
        if (selRef.current.length === 1) { const cur = shapesRef.current.find((s) => s.id === selRef.current[0]); if (cur) { const h = handleAt(p, cur, ctx()); if (h?.kind === 'rotate') cz = ROTATE_CURSOR; else if (h?.kind === 'resize') cz = resizeCursor(h.cornerKey, cur.rotation); else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' } else if (hitTest(shapesRef.current, p, ctx())) cz = 'move' }
        else if (hitTest(shapesRef.current, p, ctx())) cz = 'move'
        setHoverCursor(cz)
      }
      return
    }

    const m = drag.current.mode
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
      const lp = toLocal(p, drag.current.origShape, ctx()), a = drag.current.anchor
      let nb = { x: Math.min(a.x, lp.x), y: Math.min(a.y, lp.y), w: Math.abs(lp.x - a.x), h: Math.abs(lp.y - a.y) }
      if (e.shiftKey) { const ob = drag.current.origBox; if (ob.w > 0 && ob.h > 0) { const sc = Math.max(nb.w / ob.w, nb.h / ob.h), w = ob.w * sc, h = ob.h * sc, sx = lp.x >= a.x ? 1 : -1, sy = lp.y >= a.y ? 1 : -1, ox = a.x + sx * w, oy = a.y + sy * h; nb = { x: Math.min(a.x, ox), y: Math.min(a.y, oy), w, h } } }
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
        const hits = shapesRef.current.filter((s) => !s.hidden && aabbHit(screenAABB(s, ctx()), m)).map((s) => s.id)
        setSel(dc.add ? [...new Set([...selRef.current, ...hits])] : hits)
      }
      setMarquee(null)
    } else if (dc?.mode === 'draw' && draftRef.current) {
      let d = draftRef.current
      const isBox = BOX_TYPES.includes(d.type)
      const tinyBox = isBox && Math.abs(d.w) < 3 && Math.abs(d.h) < 3
      const tinyLine = d.type === 'line' && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3
      if (isBox) { if (d.w < 0) d = { ...d, x: d.x + d.w, w: -d.w }; if (d.h < 0) d = { ...d, y: d.y + d.h, h: -d.h } }
      if (!tinyBox && !tinyLine) setShapes((prev) => [...prev, d])
      setDraft(null)
    }
    drag.current = null
  }

  const commitText = () => {
    const current = editing
    if (!current) return
    const raw = current.value
    const empty = !raw.trim()
    setShapes((prev) => {
      if (current.id) { if (empty) return prev.filter((s) => s.id !== current.id); return prev.map((s) => (s.id === current.id ? { ...s, text: raw } : s)) }
      if (empty) return prev
      return [...prev, { id: nextId(), type: 'text', color: colorRef.current, opacity: opacityRef.current, x: current.x, y: current.y, text: raw, fontFamily, fontSize, bold }]
    })
    setEditing(null)
  }
  function handleDoubleClick(e) {
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

  // 사진 불러오기(여러 장). 파일을 서버에 업로드하고 그 URL만 도형 src로 보관한다.
  //  - 실시간 동기화 시 op에는 base64가 아니라 짧은 URL만 실려 메시지가 작고 전송이 안전하다.
  //  - 다른 참가자/재동기화는 그 URL로 이미지를 로드한다(서버 권위 상태에도 URL이 저장됨).
  const addImages = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    for (let idx = 0; idx < files.length; idx++) {
      try {
        const prepared = await prepareImageForUpload(files[idx]).catch(() => files[idx])
        const up = await uploadImage(prepared)
        const url = toAbsoluteFileUrl(up.fileUrl)
        const img = new Image()
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url })
        const nw = up.width || img.naturalWidth || 320, nh = up.height || img.naturalHeight || 320
        const maxDim = 320
        const scale = Math.min(1, maxDim / Math.max(nw, nh))
        const w = Math.max(20, Math.round(nw * scale)), h = Math.max(20, Math.round(nh * scale))
        const off = idx * 24, id = nextId()
        setShapes((prev) => [...prev, { id, type: 'image', x: 60 + off, y: 60 + off, w, h, src: url, _img: img, opacity: 1 }])
        setSel([id]); onPickSelectTool?.()
      } catch (e) {
        console.error('[whiteboard] 이미지 업로드 실패', e)
        setToast('이미지 업로드에 실패했어요. 다시 시도해 주세요.')
      }
    }
  }
  // 부모(좌측 사이드바)에서 사진 불러오기를 호출할 수 있게 노출
  useImperativeHandle(ref, () => ({ addImages }))

  // ── 페이지 동작 ── 전환 시 선택/그리기 중 상태는 초기화(페이지별 독립)
  const clearTransient = () => { setSelectedIds([]); setDraft(null); setEditing(null); setMarquee(null); setCurveHover(null); drag.current = null }
  const goToPage = (idx) => { if (idx < 0 || idx >= pages.length || idx === pageIndex) return; setPageIndex(idx); clearTransient() }
  const prevPage = () => goToPage(pageIndex - 1)
  const nextPage = () => goToPage(pageIndex + 1)
  const addPage = () => { setPages((prev) => [...prev, { id: nextId(), shapes: [] }]); setPageIndex(pages.length); clearTransient() }

  // 레이어 동작
  const onPickLayer = (e, id, isText) => {
    if (e.shiftKey) { const cur = selRef.current; setSel(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) }
    else setSel([id])
    onPickSelectTool?.()
    if (isText) { const s = shapesRef.current.find((x) => x.id === id); if (s) openTextEditor({ x: s.x, y: s.y }, s) }
  }
  const deleteLayer = (id) => { setShapes((prev) => prev.filter((s) => s.id !== id)); setSel(selRef.current.filter((x) => x !== id)) }
  const toggleHidden = (id) => setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)))
  const dropLayer = (targetId) => {
    const from = dragLayer; setDragLayer(null)
    if (!from || from === targetId) return
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

  const baseCursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'select' ? hoverCursor : 'crosshair'
  let rotHud = null
  if (selectedIds.length === 1 && tool === 'select' && ctxRef.current) {
    const s = shapes.find((x) => x.id === selectedIds[0])
    if (s) { const b = bbox(s, ctxRef.current), ce = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; rotHud = rotatePt(b.x + b.w / 2, b.y - HIT_PAD - ROT_OFFSET, ce.x, ce.y, s.rotation || 0) }
  }

  return (
    <div ref={wrapRef} style={{ height: '100%', background: '#fff', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

      {/* 인라인 알림(자동 소멸) — alert() 대신 캔버스 위 토스트 */}
      {toast && (
        <div role="alert" style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#111827', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', maxWidth: '80%', textAlign: 'center', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      <OptionsBar
        tool={tool} strokeWidth={strokeWidth} onWidth={onWidth} opacity={opacity} onOpacity={onOpacity}
        fontFamily={fontFamily} setFontFamily={setFontFamily} fontSize={fontSize} setFontSize={setFontSize}
        bold={bold} setBold={setBold} polygonSides={polygonSides} setPolygonSides={setPolygonSides}
        showWidth={showWidth} showOpacity={showOpacity}
      />

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: baseCursor }}
        onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp}
        onPointerLeave={() => { handleUp(); setEraserCursor(null) }} onDoubleClick={handleDoubleClick} />

      {/* 페이지 바 (하단 중앙): 현재/총 페이지 + ◀ ＋ ▶ */}
      <div style={{ position: 'absolute', bottom: pageBarBottom, left: '50%', transform: 'translateX(-50%)', zIndex: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, padding: '5px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <span style={{ fontWeight: 800, color: '#374151', whiteSpace: 'nowrap', minWidth: 44, textAlign: 'center' }}>
          <span style={{ color: '#2563eb' }}>{pageIndex + 1}</span> / {pages.length}
        </span>
        <span style={{ width: 1, height: 18, background: '#e5e7eb' }} />
        <button onClick={prevPage} disabled={pageIndex === 0} title="이전 페이지" style={{ border: 'none', background: 'transparent', cursor: pageIndex === 0 ? 'default' : 'pointer', opacity: pageIndex === 0 ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>◀</button>
        <button onClick={addPage} title="페이지 추가" style={{ border: '1px solid #2563eb', color: '#2563eb', background: '#fff', borderRadius: 6, height: 26, padding: '0 10px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>＋ new page</button>
        <button onClick={nextPage} disabled={pageIndex === pages.length - 1} title="다음 페이지" style={{ border: 'none', background: 'transparent', cursor: pageIndex === pages.length - 1 ? 'default' : 'pointer', opacity: pageIndex === pages.length - 1 ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>▶</button>
      </div>

      {marquee && <div style={{ position: 'absolute', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: '1px dashed #2563eb', background: 'rgba(37,99,235,0.08)', zIndex: 4, pointerEvents: 'none' }} />}

      {tool === 'eraser' && eraserCursor && (
        <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius, width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%', border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)' }} />
      )}

      <LayersPanel
        shapes={shapes} selectedIds={selectedIds} open={layersOpen} setOpen={setLayersOpen}
        panelRef={panelRef} panelPos={panelPos} onPanelDown={onPanelDown}
        onPick={onPickLayer} onToggleHidden={toggleHidden} onDelete={deleteLayer}
        onDragStartLayer={setDragLayer} onDropLayer={dropLayer}
      />

      {rotHud && (
        <div style={{ position: 'absolute', left: rotHud.x, top: rotHud.y - 32, transform: 'translateX(-50%)', zIndex: 8, background: '#111827', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <input value={degText} onFocus={() => { degFocus.current = true }} onBlur={() => { degFocus.current = false }} onChange={(e) => { setDegText(e.target.value); applyDeg(e.target.value) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} title="회전 각도(도)" style={{ width: 36, border: 'none', borderRadius: 4, padding: '1px 3px', fontSize: 11, textAlign: 'right' }} /><span>°</span>
        </div>
      )}

      {editing && (
        <textarea
          key={editing.id || `${Math.round(editing.x)}_${Math.round(editing.y)}`}
          ref={inputRef}
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing((ed) => (ed ? { ...ed, value: e.target.value } : ed))}
          onBlur={commitText}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={(e) => {
            e.stopPropagation() // 전역 단축키(Delete 등) 차단
            if (e.nativeEvent.isComposing || composingRef.current) return
            if (e.key === 'Escape') { e.preventDefault(); setEditing(null) }
          }}
          rows={Math.max(1, String(editing.value || '').split('\n').length)}
          placeholder="텍스트 입력 (Enter=줄바꿈, 영역 밖 클릭=완료)"
          style={{ position: 'absolute', left: editing.x, top: editing.y, zIndex: 9, font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color, lineHeight: 1.25, border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.97)', padding: '2px 4px', outline: 'none', minWidth: 180, minHeight: Math.round(fontSize * 1.5), resize: 'both', overflow: 'auto', whiteSpace: 'pre-wrap' }}
        />
      )}
    </div>
  )
})

export default Whiteboard
