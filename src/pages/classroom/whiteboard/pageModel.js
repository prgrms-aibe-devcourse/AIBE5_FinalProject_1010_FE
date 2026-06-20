export const findPdfBackground = (list) => list.find((s) => s.type === 'pdf' && !s.hidden && s.src)

export const pageKindOf = (page) => page?.kind || (findPdfBackground(page?.shapes || []) ? 'pdf' : 'board')

export function pageMetaOf(page) {
  const fallbackPdf = findPdfBackground(page?.shapes || [])
  return {
    kind: pageKindOf(page),
    pdfDocId: fallbackPdf?.pdfDocId ?? page?.pdfDocId ?? null,
    pdfPage: fallbackPdf?.pdfPage ?? page?.pdfPage ?? null,
    pdfPageCount: fallbackPdf?.pageCount ?? page?.pdfPageCount ?? null,
    pdfSrc: fallbackPdf?.src ?? page?.pdfSrc ?? null,
    fileName: fallbackPdf?.fileName ?? page?.fileName ?? null,
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
