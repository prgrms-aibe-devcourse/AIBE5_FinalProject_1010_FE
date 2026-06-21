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

  const setPdfPageNo = useCallback((nextPageNo) => {
    if (!canDraw) return
    const currentPage = pagesRef.current[pageIndexRef.current]
    const currentMeta = pageMetaOf(currentPage)
    const currentPdf = currentMeta.kind === 'pdf' ? currentMeta : null
    if (!currentPage || !currentPdf) return

    const pageCount = Math.max(1, Number(currentPdf.pdfPageCount) || Number(currentPdf.pageCount) || 1)
    const pdfPage = Math.max(1, Math.min(pageCount, Number(nextPageNo) || 1))
    setPages((prev) => prev.map((pg) => {
      if (pg.id !== currentPage.id) return pg
      return {
        ...pg,
        kind: 'pdf',
        pdfDocId: currentPdf.pdfDocId,
        pdfPage,
        pdfPageCount: pageCount,
        pdfSrc: currentPdf.pdfSrc,
        fileName: currentPdf.fileName,
        shapes: (pg.shapes || []).map((s) => (s.type === 'pdf'
          ? { ...s, pdfDocId: currentPdf.pdfDocId, pdfPage, pageCount }
          : s)),
      }
    }))
  }, [canDraw, pageIndexRef, pagesRef, setPages])

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

  // 여러 PDF 문서 사이 이동(각 PDF = 별도 페이지). 현재 PDF 페이지 기준 이전/다음 문서로 전환한다.
  // 이미 보드에 있는 페이지로 이동만 하므로 재업로드·재다운로드 없이(브라우저 캐시) 즉시 전환된다.
  const prevPdfDoc = useCallback(() => {
    const entries = pdfEntries()
    const curId = pagesRef.current[pageIndexRef.current]?.id
    const current = entries.findIndex((entry) => entry.page.id === curId)
    goToEntry(entries[current - 1])
  }, [goToEntry, pageIndexRef, pagesRef, pdfEntries])

  const nextPdfDoc = useCallback(() => {
    const entries = pdfEntries()
    const curId = pagesRef.current[pageIndexRef.current]?.id
    const current = entries.findIndex((entry) => entry.page.id === curId)
    goToEntry(entries[current + 1])
  }, [goToEntry, pageIndexRef, pagesRef, pdfEntries])

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
