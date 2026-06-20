import { useEffect } from 'react'
import { pageMetaOf } from './pageModel.js'
import { readPdfPageCount } from './pdf.js'

export function usePdfPageCountGuard({ activePdf, canDraw, checkedRef, setPages }) {
  useEffect(() => {
    if (!canDraw || !activePdf?.src) return
    const key = `${activePdf.pdfDocId || activePdf.src}:${activePdf.src}:${activePdf.pageCount || ''}`
    if (checkedRef.current.has(key)) return
    checkedRef.current.add(key)

    let cancelled = false
    fetch(activePdf.src)
      .then((res) => {
        if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`)
        return res.blob()
      })
      .then(readPdfPageCount)
      .then((actualCount) => {
        if (cancelled || !Number.isFinite(actualCount) || actualCount <= 0 || actualCount === Number(activePdf.pageCount)) return
        setPages((prev) => prev.map((pg) => {
          const meta = pageMetaOf(pg)
          if (meta.kind !== 'pdf' || meta.pdfDocId !== activePdf.pdfDocId) return pg
          const pdfPage = Math.max(1, Math.min(actualCount, Number(meta.pdfPage) || 1))
          return {
            ...pg,
            pdfPage,
            pdfPageCount: actualCount,
            shapes: (pg.shapes || []).map((s) => (s.type === 'pdf'
              ? { ...s, pdfPage, pageCount: actualCount }
              : s)),
          }
        }))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [activePdf?.pdfDocId, activePdf?.src, activePdf?.pageCount, canDraw, checkedRef, setPages])
}
