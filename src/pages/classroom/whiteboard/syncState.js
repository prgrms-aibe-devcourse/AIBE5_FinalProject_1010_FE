export const serShape = (s, isUpdate) => ({ ...s, _img: undefined, src: isUpdate ? undefined : s.src })

export const buildPrev = (pgs) =>
  new Map(pgs.map((pg) => [pg.id, { ref: pg.shapes, map: new Map(pg.shapes.map((s) => [s.id, s])) }]))

export function createHydrator(redraw) {
  return (s) => {
    if (s.type === 'image' && s.src && !s._img) {
      const img = new Image()
      img.onload = () => redraw()
      img.src = s.src
      return { ...s, _img: img }
    }
    return s
  }
}

export function applyOps(prevPages, ops, hydrate) {
  let next = prevPages
  for (const o of ops) {
    if (o.op === 'addPage') {
      if (!next.find((p) => p.id === o.pageId)) {
        next = [...next, {
          id: o.pageId,
          kind: o.kind || 'board',
          pdfDocId: o.pdfDocId ?? null,
          pdfPage: o.pdfPage ?? null,
          pdfPageCount: o.pdfPageCount ?? null,
          pdfSrc: o.pdfSrc ?? null,
          fileName: o.fileName ?? null,
          shapes: [],
        }]
      }
    } else if (o.op === 'removePage') {
      next = next.filter((p) => p.id !== o.pageId)
    } else {
      next = next.map((p) => {
        if (p.id !== o.pageId) return p
        if (o.op === 'add') return p.shapes.some((s) => s.id === o.shape.id) ? p : { ...p, shapes: [...p.shapes, hydrate(o.shape)] }
        if (o.op === 'update') return { ...p, shapes: p.shapes.map((s) => (s.id === o.shape.id ? hydrate({ ...s, ...o.shape }) : s)) }
        if (o.op === 'remove') return { ...p, shapes: p.shapes.filter((s) => s.id !== o.id) }
        if (o.op === 'clear') return { ...p, shapes: [] }
        if (o.op === 'reorder') {
          const m = new Map(p.shapes.map((s) => [s.id, s]))
          return { ...p, shapes: o.ids.map((id) => m.get(id)).filter(Boolean) }
        }
        return p
      })
    }
  }
  return next
}

export const snapPages = (pgs) => pgs.map((p) => ({ ...p, shapes: p.shapes.slice() }))
