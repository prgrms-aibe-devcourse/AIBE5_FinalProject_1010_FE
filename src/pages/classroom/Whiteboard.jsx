/**
 * @file Whiteboard.jsx
 * @description 강의실 화이트보드 — 객체(retained) 기반 <canvas> 오케스트레이터.
 * - 상태(pages/draft/selection/view/도구 옵션)를 보유하고, 동작은 whiteboard/* 훅으로 위임한다.
 *   · useWhiteboardCanvas  : 캔버스 렌더(redraw/fit)
 *   · useWhiteboardSync    : 서버 권위 동기화(ops/seq/resync)
 *   · useWhiteboardHistory : 실행취소/다시실행 + 방향키 이동
 *   · useWhiteboardPointer : 포인터 핸들러(그리기/선택/이동/지우기/줌·팬/텍스트)
 *   · useWhiteboardKeyboard: 단축키
 *   · useWhiteboardPages   : 페이지/PDF 섹션 이동·추가
 *   · useWhiteboardMedia   : 이미지/PDF 추가
 *   · useWhiteboardLayers  : 레이어 패널
 * - 도구: select·pen·highlighter·line·curve·rect·ellipse·triangle·polygon·text·eraser·hand·zoom.
 */
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { TEXT_SIZE, HIT_PAD, ROT_OFFSET, nextId, isViewTool, PDF_BOARD_WIDTH, PDF_DEFAULT_RATIO } from './whiteboard/constants.js'
import { rotatePt, bbox } from './whiteboard/geometry.js'
import OptionsBar from './whiteboard/OptionsBar.jsx'
import LayersPanel from './whiteboard/LayersPanel.jsx'
import PdfBackground from './whiteboard/PdfBackground.jsx'
import PageBar from './whiteboard/PageBar.jsx'
import { EraserCursor, MarqueeSelection, RotationHud, TextEditorOverlay, ToastBanner } from './whiteboard/Overlays.jsx'
import { pageEntriesOf, pageKindOf, pageMetaOf } from './whiteboard/pageModel.js'
import { useWhiteboardCanvas } from './whiteboard/useWhiteboardCanvas.js'
import { useWhiteboardSync } from './whiteboard/useWhiteboardSync.js'
import { useWhiteboardHistory } from './whiteboard/useWhiteboardHistory.js'
import { useWhiteboardPointer } from './whiteboard/useWhiteboardPointer.js'
import { useWhiteboardKeyboard } from './whiteboard/useWhiteboardKeyboard.js'
import { useWhiteboardPages } from './whiteboard/useWhiteboardPages.js'
import { useWhiteboardMedia } from './whiteboard/useWhiteboardMedia.js'
import { useWhiteboardLayers } from './whiteboard/useWhiteboardLayers.js'
import { usePdfPageCountGuard } from './whiteboard/usePdfPageCountGuard.js'
import { DEFAULT_VIEW, viewCssTransform, clampZoom } from './whiteboard/viewTransform.js'

const Whiteboard = forwardRef(function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0, onPickSelectTool, onSetTool, sessionId = null, isTeacher = false, pageBarBottom = 12, transparent = false, canDraw = true, drawerNames = {}, readOnly = false }, ref) {
  const canvasRef = useRef(null), ctxRef = useRef(null), wrapRef = useRef(null), inputRef = useRef(null)
  const composingRef = useRef(false)

  // 여러 페이지: 각 페이지가 자신의 shapes(도형=레이어)를 가진다. 활성 페이지만 캔버스/레이어에 표시.
  // 초기 첫 페이지 id는 서버 보드의 기본 페이지와 동일한 'p1'로 맞춘다.
  // (nextId()로 만들면 클라마다 id가 달라 서버 p1과 별개로 addPage돼 보드가 2장으로 늘어남 → "1/2" 표시 버그)
  const [pages, setPages] = useState(() => [{ id: 'p1', kind: 'board', shapes: [] }])
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
  const [degText, setDegText] = useState('0')
  const degFocus = useRef(false)
  const [pdfPageInput, setPdfPageInput] = useState('1')
  const pdfPageInputFocusRef = useRef(false)
  const [view, setView] = useState(DEFAULT_VIEW)
  const viewRef = useRef(DEFAULT_VIEW)
  const [isPanning, setIsPanning] = useState(false)

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
  const lastFitPageIdRef = useRef(null) // PDF 페이지 진입 시 1회 뷰 맞춤 여부(페이지 번호 넘김 시 재맞춤 방지)
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
  // PDF "문서"에 처음 진입할 때 그 고정 board 영역이 보드에 꽉 차도록 로컬 뷰를 맞춘다(중앙 정렬).
  // view는 동기화되지 않으므로 참가자마다 자기 화면 크기에 맞게 PDF 전체를 본다.
  // 같은 문서(pdfDocId 동일) 안에서 페이지 번호만 넘길 때는 재맞춤하지 않아 줌/팬을 유지한다(rect 동일).
  useEffect(() => {
    const page = pages[pageIndex]
    if (!page || pageKindOf(page) !== 'pdf') { lastFitPageIdRef.current = null; return }
    const meta = pageMetaOf(page)
    const fitKey = meta.pdfDocId || page.id
    if (lastFitPageIdRef.current === fitKey) return
    const rect = meta.pdfRect
    const wrap = wrapRef.current
    if (!rect || !wrap || !wrap.clientWidth || !wrap.clientHeight) return
    lastFitPageIdRef.current = fitKey
    const pad = 24
    const scale = clampZoom(Math.min((wrap.clientWidth - pad * 2) / rect.w, (wrap.clientHeight - pad * 2) / rect.h))
    setView({
      scale,
      x: (wrap.clientWidth - rect.w * scale) / 2 - rect.x * scale,
      y: (wrap.clientHeight - rect.h * scale) / 2 - rect.y * scale,
    })
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

  const setSel = (ids) => setSelectedIds(ids)

  // ───────────── 캔버스 렌더 ─────────────
  const { redraw } = useWhiteboardCanvas({
    canvasRef, ctxRef, wrapRef, viewRef,
    shapesRef, draftRef, curveHoverRef, selRef, remoteLiveRef, drawerNamesRef, activePageIdRef,
    view, shapes, draft, selectedIds, marquee, curveHover,
  })
  // 이름 맵이 바뀌면 ref 갱신 후 다시 그려 라벨을 최신 이름으로 반영
  useEffect(() => { drawerNamesRef.current = drawerNames; redraw() }, [drawerNames, redraw])

  useEffect(() => { if (clearNonce === 0) return; pushUndoRef.current?.(); setShapes([]); setSelectedIds([]); setEditing(null); setDraft(null) }, [clearNonce, setShapes])
  useEffect(() => { if (!selRef.current.length) return; pushUndoRef.current?.(); const set = new Set(selRef.current); setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, color } : s))) }, [color, setShapes])
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

  // ───────────── 서버 권위 동기화 ─────────────
  const { pagesRef, sessionIdRef, hydrate } = useWhiteboardSync({
    pages, setPages, sessionId, draft, curveHover, redraw,
    activePageIdRef, remoteLiveRef, setFollowPageId, readOnly,
  })

  // ───────────── 실행취소/다시실행 + 방향키 이동 ─────────────
  const {
    movedRef, pushUndo, beginHistory, commitHistory, cancelHistory, doUndo, doRedo, nudgeSelected,
  } = useWhiteboardHistory({
    pagesRef, setPages, setShapes, selRef, setSelectedIds, setEditing, setDraft, setCurveHover, pushUndoRef,
  })

  // ───────────── 포인터 상호작용 ─────────────
  const {
    handleDown, handleMove, handleUp, handleDoubleClick, commitText, openTextEditor, zoomFromCenter, resetView,
  } = useWhiteboardPointer({
    canvasRef, wrapRef, ctxRef, viewRef,
    toolRef, colorRef, widthRef, opacityRef, polygonSidesRef, eraseRadiusRef,
    shapesRef, draftRef, selRef, drag,
    setView, setIsPanning, setShapes, setSel, setEditing, setDraft, setMarquee, setCurveHover, setHoverCursor, setEraserCursor,
    beginHistory, commitHistory, cancelHistory, pushUndo, movedRef,
    pagesRef,
    editing, tool, canDraw, marquee, fontFamily, fontSize, bold,
    inputRef,
  })

  // ───────────── 단축키 ─────────────
  useWhiteboardKeyboard({
    editing, canDraw, onSetTool,
    toolRef, draftRef, selRef, pagesRef,
    setShapes, setSelectedIds, setDraft, setCurveHover, setPolygonSides,
    pushUndo, cancelHistory, doUndo, doRedo, nudgeSelected,
    zoomFromCenter, resetView,
  })

  // ───────────── 페이지/PDF 섹션 이동·추가 ─────────────
  const {
    clearTransient, broadcastActivePage,
    prevPage, nextPage, commitPdfPageInput, prevPdfPage, nextPdfPage, goToPdfDoc, deletePdfDoc, goToWhiteboard, goToPdf, addPage,
  } = useWhiteboardPages({
    canDraw, followPageId, pages, pagesRef, pageIndexRef, sessionIdRef,
    setPageIndex, setPages, setFollowPageId, setSelectedIds, setDraft, setEditing, setMarquee, setCurveHover,
    dragRef: drag, lastWhiteboardPageIdRef, lastPdfPageIdRef, pdfPageInput, setPdfPageInput, pushUndo,
  })

  // ───────────── 이미지/PDF 추가 ─────────────
  const { addImages, addPdf } = useWhiteboardMedia({
    canDraw, sessionId, pagesRef, setPages, setShapes, setSel,
    pushUndo, clearTransient, broadcastActivePage, onPickSelectTool, setToast,
  })
  useImperativeHandle(ref, () => ({ addImages, addPdf }))

  // ───────────── 레이어 패널 ─────────────
  const {
    layersOpen, setLayersOpen, dragLayer, setDragLayer, panelPos, panelRef,
    onPickLayer, deleteLayer, toggleHidden, dropLayer, onPanelDown,
  } = useWhiteboardLayers({
    selRef, setSel, onPickSelectTool, shapesRef, openTextEditor, pushUndo, pagesRef, setShapes, wrapRef,
  })

  // ───────────── 도구 옵션 적용(선택 도형/현재 도구) ─────────────
  const applyToSelected = (patch) => { const set = new Set(selRef.current); if (set.size) setShapes((prev) => prev.map((s) => (set.has(s.id) ? { ...s, ...patch } : s))) }
  const onWidth = (w) => { setStrokeWidth(w); applyToSelected({ width: w }) }
  const onOpacity = (o) => { setOpacity(o); applyToSelected({ opacity: o }) }
  const applyDeg = (text) => { const n = parseFloat(text); if (Number.isFinite(n)) applyToSelected({ rotation: (n * Math.PI) / 180 }) }

  // ───────────── 옵션 표시 제어 / 파생값 ─────────────
  //  - 지우개: 투명도 숨김(굵기=지우개 크기는 표시)
  //  - 텍스트(도구/선택): 굵기 숨김(글자 크기 px로 조절하므로 stroke 폭 무의미)
  //  - 사진(선택): 굵기 숨김(이미지는 stroke 폭 무의미)
  const typeOf = (id) => shapes.find((s) => s.id === id)?.type
  const selAllImage = selectedIds.length > 0 && selectedIds.every((id) => typeOf(id) === 'image')
  const selAllText = selectedIds.length > 0 && selectedIds.every((id) => typeOf(id) === 'text')
  const viewToolActive = isViewTool(tool)
  const showWidth = !viewToolActive && tool !== 'text' && !selAllImage && !selAllText
  const showOpacity = !viewToolActive && tool !== 'eraser'
  const currentPage = pages[pageIndex]
  const currentPageMeta = pageMetaOf(currentPage)
  const pdfRect = currentPageMeta.pdfRect || { x: 0, y: 0, w: PDF_BOARD_WIDTH, h: Math.round(PDF_BOARD_WIDTH * PDF_DEFAULT_RATIO) }
  const activePdf = currentPageMeta.kind === 'pdf'
    ? {
      pdfDocId: currentPageMeta.pdfDocId,
      pdfPage: currentPageMeta.pdfPage || 1,
      pageCount: currentPageMeta.pdfPageCount || 1,
      src: currentPageMeta.pdfSrc,
      fileName: currentPageMeta.fileName,
      x: pdfRect.x,
      y: pdfRect.y,
      w: pdfRect.w,
      h: pdfRect.h,
    }
    : null
  const pageEntries = pageEntriesOf(pages)
  const boardPageEntries = pageEntries.filter((entry) => !entry.pdf)
  const pdfPageEntries = pageEntries.filter((entry) => entry.pdf)
  const currentBoardIndex = boardPageEntries.findIndex((entry) => entry.page.id === currentPage?.id)
  const currentPdfPageNo = activePdf ? Math.max(1, Number(activePdf.pdfPage) || 1) : 0
  const currentPdfPageCount = activePdf ? Math.max(currentPdfPageNo, Number(activePdf.pageCount) || 1) : 0
  const hasPdf = pdfPageEntries.length > 0
  // PDF 목록(문서 단위): 이름 + docId. 목록 UI에서 클릭 이동/삭제, 현재 보는 문서 표시에 사용.
  // (한 PDF 문서는 페이지 번호별로 여러 페이지 객체를 가지므로 객체가 아니라 문서로 dedupe)
  const pdfDocs = []
  pdfPageEntries.forEach((entry) => {
    const id = entry.pdf?.pdfDocId
    if (id && !pdfDocs.some((d) => d.docId === id)) pdfDocs.push({ docId: id, fileName: entry.pdf.fileName })
  })
  const currentPdfDocId = activePdf?.pdfDocId || null

  usePdfPageCountGuard({ activePdf, canDraw, checkedRef: pdfCountCheckedRef, setPages })

  const baseCursor = tool === 'hand'
    ? (isPanning ? 'grabbing' : 'grab')
    : tool === 'zoomIn'
      ? 'zoom-in'
      : tool === 'zoomOut'
        ? 'zoom-out'
        : tool === 'text'
          ? 'text'
          : tool === 'eraser'
            ? 'cell'
            : tool === 'select'
              ? hoverCursor
              : 'crosshair'
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
      <PdfBackground activePdf={activePdf} transparent={transparent} view={view} />
      <ToastBanner toast={toast} />

      {/* 미리보기(readOnly)에서는 툴바(OptionsBar)를 감춘다 */}
      {!readOnly && (
        <OptionsBar
          tool={tool} strokeWidth={strokeWidth} onWidth={onWidth} opacity={opacity} onOpacity={onOpacity}
          fontFamily={fontFamily} setFontFamily={setFontFamily} fontSize={fontSize} setFontSize={setFontSize}
          bold={bold} setBold={setBold} polygonSides={polygonSides} setPolygonSides={setPolygonSides}
          showWidth={showWidth} showOpacity={showOpacity}
          zoom={view.scale} onZoomIn={() => zoomFromCenter(1.2)} onZoomOut={() => zoomFromCenter(1 / 1.2)}
          onZoomReset={resetView} onSetTool={onSetTool} sessionId={sessionId} isTeacher={isTeacher} userNames={drawerNames}
        />
      )}

      {/* readOnly면 캔버스 상호작용 차단(아무것도 못 만지고 보기만) */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 2, touchAction: 'none', pointerEvents: readOnly ? 'none' : 'auto', cursor: (canDraw || viewToolActive) ? baseCursor : 'not-allowed' }}
        onPointerDown={readOnly ? undefined : handleDown} onPointerMove={readOnly ? undefined : handleMove} onPointerUp={readOnly ? undefined : handleUp}
        onPointerLeave={readOnly ? undefined : () => { handleUp(); setEraserCursor(null) }} onDoubleClick={readOnly ? undefined : handleDoubleClick} />

      {!readOnly && <PageBar
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
        pdfDocs={pdfDocs}
        currentPdfDocId={currentPdfDocId}
        onSelectPdfDoc={goToPdfDoc}
        onDeletePdfDoc={deletePdfDoc}
      />}

      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', transform: viewCssTransform(view), transformOrigin: '0 0' }}>
        <MarqueeSelection marquee={marquee} />
        <EraserCursor show={tool === 'eraser'} eraserCursor={eraserCursor} eraseRadius={eraseRadius} />
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

      {!readOnly && <LayersPanel
        shapes={shapes} selectedIds={selectedIds} open={layersOpen} setOpen={setLayersOpen}
        panelRef={panelRef} panelPos={panelPos} onPanelDown={onPanelDown}
        onPick={onPickLayer} onToggleHidden={toggleHidden} onDelete={deleteLayer}
        onDragStartLayer={setDragLayer} onDropLayer={dropLayer}
      />}
    </div>
  )
})

export default Whiteboard

