import { useCallback, useEffect } from 'react'
import { sendWhiteboard } from '../../../api/chatSocket.js'
import { nextId } from './constants.js'
import { pageEntriesOf, pageMetaOf } from './pageModel.js'

export function useWhiteboardPages({
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
  dragRef,
  lastWhiteboardPageIdRef,
  lastPdfPageIdRef,
  pdfPageInput,
  setPdfPageInput,
}) {
  const clearTransient = useCallback(() => {
    setSelectedIds([])
    setDraft(null)
    setEditing(null)
    setMarquee(null)
    setCurveHover(null)
    dragRef.current = null
  }, [dragRef, setCurveHover, setDraft, setEditing, setMarquee, setSelectedIds])

  const broadcastActivePage = useCallback((pageId) => {
    if (!pageId) return
    if (sessionIdRef.current != null) sendWhiteboard(sessionIdRef.current, { type: 'page', pageId })
    setFollowPageId(pageId)
  }, [sessionIdRef, setFollowPageId])

  const whiteboardEntries = useCallback((source = pagesRef.current) =>
    pageEntriesOf(source).filter((entry) => !entry.pdf), [pagesRef])

  const pdfEntries = useCallback((source = pagesRef.current, pdfDocId = null) =>
    pageEntriesOf(source).filter((entry) =>
      entry.pdf && (!pdfDocId || entry.pdf.pdfDocId === pdfDocId)
    ), [pagesRef])

  const goToEntry = useCallback((entry) => {
    if (!canDraw || !entry) return
    broadcastActivePage(entry.page.id)
  }, [broadcastActivePage, canDraw])

  const prevPage = useCallback(() => {
    const entries = whiteboardEntries()
    const currentPageId = pagesRef.current[pageIndexRef.current]?.id
    const current = entries.findIndex((entry) => entry.page.id === currentPageId)
    goToEntry(entries[current - 1])
  }, [goToEntry, pageIndexRef, pagesRef, whiteboardEntries])

  const nextPage = useCallback(() => {
    const entries = whiteboardEntries()
    const currentPageId = pagesRef.current[pageIndexRef.current]?.id
    const current = entries.findIndex((entry) => entry.page.id === currentPageId)
    goToEntry(entries[current + 1])
  }, [goToEntry, pageIndexRef, pagesRef, whiteboardEntries])

  // PDF의 각 페이지 번호를 "별도 페이지 객체"로 둬서 화이트보드처럼 페이지별로 필기가 분리되게 한다.
  // 방문할 때 해당 (문서, 페이지번호) 객체가 없으면 지연 생성하고, 있으면 그 객체로 이동만 한다.
  const setPdfPageNo = useCallback((nextPageNo) => {
    if (!canDraw) return
    const currentPage = pagesRef.current[pageIndexRef.current]
    const currentMeta = pageMetaOf(currentPage)
    if (!currentPage || currentMeta.kind !== 'pdf') return

    const pageCount = Math.max(1, Number(currentMeta.pdfPageCount) || 1)
    const target = Math.max(1, Math.min(pageCount, Math.trunc(Number(nextPageNo)) || 1))
    if (target === Number(currentMeta.pdfPage)) return // 같은 페이지면 무시

    // 같은 문서의 target 페이지 객체가 이미 있으면 그쪽으로 이동(필기 보존)
    const existing = pagesRef.current.find((pg) => {
      const m = pageMetaOf(pg)
      return m.kind === 'pdf' && m.pdfDocId === currentMeta.pdfDocId && Number(m.pdfPage) === target
    })
    if (existing) { broadcastActivePage(existing.id); return }

    // 없으면 빈 필기의 새 PDF 페이지 객체를 만들고(끝에 추가 → 동기화) 그쪽으로 이동.
    // 배경 도형의 메타/박스(rect)는 같은 문서의 현재 배경에서 복사한다.
    const bg = (currentPage.shapes || []).find((s) => s.type === 'pdf') || {}
    const id = nextId()
    const newPage = {
      id,
      kind: 'pdf',
      pdfDocId: currentMeta.pdfDocId,
      pdfPage: target,
      pdfPageCount: pageCount,
      pdfSrc: currentMeta.pdfSrc,
      fileName: currentMeta.fileName,
      shapes: [{
        id: nextId(),
        type: 'pdf',
        pdfDocId: currentMeta.pdfDocId,
        pdfPage: target,
        pageCount,
        fileId: bg.fileId,
        src: currentMeta.pdfSrc,
        fileName: currentMeta.fileName,
        locked: true,
        background: true,
        x: bg.x ?? 0,
        y: bg.y ?? 0,
        w: bg.w,
        h: bg.h,
      }],
    }
    setPages((prev) => [...prev, newPage])
    broadcastActivePage(id)
  }, [broadcastActivePage, canDraw, pageIndexRef, pagesRef, setPages])

  const commitPdfPageInput = useCallback(() => {
    const currentPdf = pageMetaOf(pagesRef.current[pageIndexRef.current])
    const pageCount = Math.max(1, Number(currentPdf.pdfPageCount) || Number(currentPdf.pageCount) || 1)
    const nextPageNo = Math.max(1, Math.min(pageCount, Math.trunc(Number(pdfPageInput)) || 1))
    setPdfPageInput(String(nextPageNo))
    setPdfPageNo(nextPageNo)
  }, [pageIndexRef, pagesRef, pdfPageInput, setPdfPageInput, setPdfPageNo])

  const prevPdfPage = useCallback(() => {
    const currentPdf = pageMetaOf(pagesRef.current[pageIndexRef.current])
    setPdfPageNo((Number(currentPdf.pdfPage) || 1) - 1)
  }, [pageIndexRef, pagesRef, setPdfPageNo])

  const nextPdfPage = useCallback(() => {
    const currentPdf = pageMetaOf(pagesRef.current[pageIndexRef.current])
    setPdfPageNo((Number(currentPdf.pdfPage) || 1) + 1)
  }, [pageIndexRef, pagesRef, setPdfPageNo])

  const goToWhiteboard = useCallback(() => {
    const entries = whiteboardEntries()
    const target = entries.find((entry) => entry.page.id === lastWhiteboardPageIdRef.current) || entries[0]
    goToEntry(target)
  }, [goToEntry, lastWhiteboardPageIdRef, whiteboardEntries])

  const goToPdf = useCallback(() => {
    const entries = pdfEntries()
    const target = entries.find((entry) => entry.page.id === lastPdfPageIdRef.current) || entries[0]
    goToEntry(target)
  }, [goToEntry, lastPdfPageIdRef, pdfEntries])

  // 여러 PDF "문서" 사이 이동. 한 문서는 페이지 번호별로 여러 페이지 객체를 가지므로
  // 문서 단위(pdfDocId)로 묶어, 이전/다음 문서의 "가장 낮은 페이지" 객체로 이동한다.
  // 이미 보드에 있는 페이지로 가는 것이라 재업로드·재다운로드 없이(캐시) 즉시 전환된다.
  const pdfDocIds = useCallback((source = pagesRef.current) => {
    const seen = []
    source.forEach((pg) => {
      const m = pageMetaOf(pg)
      if (m.kind === 'pdf' && m.pdfDocId && !seen.includes(m.pdfDocId)) seen.push(m.pdfDocId)
    })
    return seen
  }, [pagesRef])

  const goToPdfDoc = useCallback((docId) => {
    if (!canDraw || !docId) return
    const candidates = pagesRef.current.filter((pg) => {
      const m = pageMetaOf(pg)
      return m.kind === 'pdf' && m.pdfDocId === docId
    })
    if (!candidates.length) return
    const target = candidates.reduce((a, b) =>
      ((Number(pageMetaOf(a).pdfPage) || 1) <= (Number(pageMetaOf(b).pdfPage) || 1) ? a : b))
    broadcastActivePage(target.id)
  }, [broadcastActivePage, canDraw, pagesRef])

  const prevPdfDoc = useCallback(() => {
    const docs = pdfDocIds()
    const curDoc = pageMetaOf(pagesRef.current[pageIndexRef.current]).pdfDocId
    goToPdfDoc(docs[docs.indexOf(curDoc) - 1])
  }, [goToPdfDoc, pageIndexRef, pagesRef, pdfDocIds])

  const nextPdfDoc = useCallback(() => {
    const docs = pdfDocIds()
    const curDoc = pageMetaOf(pagesRef.current[pageIndexRef.current]).pdfDocId
    goToPdfDoc(docs[docs.indexOf(curDoc) + 1])
  }, [goToPdfDoc, pageIndexRef, pagesRef, pdfDocIds])

  const addPage = useCallback(() => {
    if (!canDraw) return
    const id = nextId()
    setPages((prev) => [...prev, { id, kind: 'board', shapes: [] }])
    broadcastActivePage(id)
  }, [broadcastActivePage, canDraw, setPages])

  useEffect(() => {
    if (followPageId == null) return
    const i = pages.findIndex((p) => p.id === followPageId)
    if (i >= 0 && i !== pageIndexRef.current) {
      setPageIndex(i)
      clearTransient()
    }
  }, [clearTransient, followPageId, pageIndexRef, pages, setPageIndex])

  return {
    clearTransient,
    broadcastActivePage,
    prevPage,
    nextPage,
    commitPdfPageInput,
    prevPdfPage,
    nextPdfPage,
    prevPdfDoc,
    nextPdfDoc,
    goToWhiteboard,
    goToPdf,
    addPage,
  }
}
