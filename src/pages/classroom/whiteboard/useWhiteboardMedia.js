import { uploadImage, prepareImageForUpload, toAbsoluteFileUrl, uploadClassroomPdf } from '../../../api/fileApi.js'
import { nextId, PDF_BOARD_WIDTH, PDF_DEFAULT_RATIO } from './constants.js'
import { readPdfPageCount, readPdfPageRatio } from './pdf.js'
import { snapPages } from './syncState.js'

export function useWhiteboardMedia({
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
}) {
  const addImages = async (fileList) => {
    if (!canDraw) return
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    for (let idx = 0; idx < files.length; idx++) {
      try {
        const prepared = await prepareImageForUpload(files[idx]).catch(() => files[idx])
        const up = await uploadImage(prepared)
        const url = toAbsoluteFileUrl(up.fileUrl)
        const img = new Image()
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url })
        const nw = up.width || img.naturalWidth || 320
        const nh = up.height || img.naturalHeight || 320
        const maxDim = 320
        const scale = Math.min(1, maxDim / Math.max(nw, nh))
        const w = Math.max(20, Math.round(nw * scale))
        const h = Math.max(20, Math.round(nh * scale))
        const off = idx * 24
        const id = nextId()
        pushUndo(snapPages(pagesRef.current))
        setShapes((prev) => [...prev, { id, type: 'image', x: 60 + off, y: 60 + off, w, h, src: url, _img: img, opacity: 1 }])
        setSel([id])
        onPickSelectTool?.()
      } catch (e) {
        console.error('[whiteboard] image upload failed', e)
        setToast('이미지 업로드에 실패했어요. 다시 시도해 주세요.')
      }
    }
  }

  const addPdf = async (fileList) => {
    if (!canDraw) return
    const file = Array.from(fileList || []).find((f) =>
      f?.type === 'application/pdf' || /\.pdf$/i.test(f?.name || '')
    )
    if (!file) return

    try {
      setToast('PDF 업로드 중입니다...')
      const pageCount = await readPdfPageCount(file)
      const up = await uploadClassroomPdf(file)
      const url = toAbsoluteFileUrl(up.fileUrl)
      // PDF 배경의 "고정 board 영역" 크기 결정: 가로는 상수, 세로는 첫 페이지 종횡비.
      // 이 rect를 도형에 저장해 동기화/스냅샷에 함께 실으면 전 참가자가 같은 좌표계를 공유한다.
      const ratio = (await readPdfPageRatio(url).catch(() => null)) || PDF_DEFAULT_RATIO
      const boardW = PDF_BOARD_WIDTH
      const boardH = Math.round(boardW * ratio)
      const pdfDocId = nextId()
      const startIndex = pageIndexRef.current + 1
      const pdfPage = {
        id: nextId(),
        kind: 'pdf',
        pdfDocId,
        pdfPage: 1,
        pdfPageCount: pageCount,
        pdfSrc: url,
        fileName: up.originalFileName || file.name,
        shapes: [{
          id: nextId(),
          type: 'pdf',
          pdfDocId,
          pdfPage: 1,
          pageCount,
          fileId: up.fileId,
          src: url,
          fileName: up.originalFileName || file.name,
          locked: true,
          background: true,
          x: 0,
          y: 0,
          w: boardW,
          h: boardH,
        }],
      }
      pushUndo(snapPages(pagesRef.current))
      clearTransient()
      setPages((prev) => {
        const next = prev.slice()
        next.splice(startIndex, 0, pdfPage)
        return next
      })
      broadcastActivePage(pdfPage.id)
      setToast(`PDF ${pageCount}페이지를 화이트보드에 추가했습니다.`)
      onPickSelectTool?.()
    } catch (e) {
      console.error('[whiteboard] PDF upload failed', e)
      setToast(e?.message || 'PDF 업로드에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return { addImages, addPdf }
}
