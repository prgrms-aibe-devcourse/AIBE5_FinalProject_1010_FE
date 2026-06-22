import { PDF_BOARD_WIDTH, PDF_DEFAULT_RATIO } from './constants.js'

export const findPdfBackground = (list) => list.find((s) => s.type === 'pdf' && !s.hidden && s.src)

export const pageKindOf = (page) => page?.kind || (findPdfBackground(page?.shapes || []) ? 'pdf' : 'board')

// PDF 배경이 차지하는 "고정 board 영역"(전 참가자 공통). 모든 클라이언트가 같은 rect를 쓰므로
// 그 위에 board 좌표로 찍힌 필기는 화면 크기와 무관하게 동일 위치에 정렬된다.
// 구버전/누락 데이터(w·h가 없거나 1px placeholder)는 기본 A4 비율로 보정한다.
export function pdfRectOf(shape) {
  if (!shape) return null
  const hasSize = Number(shape.w) > 2 && Number(shape.h) > 2
  const w = hasSize ? Number(shape.w) : PDF_BOARD_WIDTH
  const h = hasSize ? Number(shape.h) : Math.round(PDF_BOARD_WIDTH * PDF_DEFAULT_RATIO)
  return { x: Number(shape.x) || 0, y: Number(shape.y) || 0, w, h }
}

export function pageMetaOf(page) {
  const fallbackPdf = findPdfBackground(page?.shapes || [])
  return {
    kind: pageKindOf(page),
    pdfDocId: fallbackPdf?.pdfDocId ?? page?.pdfDocId ?? null,
    pdfPage: fallbackPdf?.pdfPage ?? page?.pdfPage ?? null,
    pdfPageCount: fallbackPdf?.pageCount ?? page?.pdfPageCount ?? null,
    pdfSrc: fallbackPdf?.src ?? page?.pdfSrc ?? null,
    fileName: fallbackPdf?.fileName ?? page?.fileName ?? null,
    pdfRect: fallbackPdf ? pdfRectOf(fallbackPdf) : null,
  }
}

export function pageEntriesOf(list) {
  return list.map((page, index) => {
    const meta = pageMetaOf(page)
    return {
      page,
      index,
      pdf: meta.kind === 'pdf'
        ? {
          pdfDocId: meta.pdfDocId,
          pdfPage: meta.pdfPage || 1,
          pageCount: meta.pdfPageCount || 1,
          src: meta.pdfSrc,
          fileName: meta.fileName,
        }
        : null,
    }
  })
}
