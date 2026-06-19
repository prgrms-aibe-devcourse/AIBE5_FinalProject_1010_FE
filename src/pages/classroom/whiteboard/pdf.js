export async function readPdfPageCount(file) {
  if (!file) return 1

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2d
  if (!isPdf) throw new Error('PDF 파일만 추가할 수 있습니다.')

  const text = new TextDecoder('latin1').decode(await file.arrayBuffer())
  const pageMatches = text.match(/\/Type\s*\/Page\b/g)
  if (pageMatches?.length) return clampPageCount(pageMatches.length)

  const counts = [...text.matchAll(/\/Count\s+(\d+)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0)

  return clampPageCount(counts.length ? Math.max(...counts) : 1)
}

export function pdfViewerUrl(url, page = 1) {
  if (!url) return ''
  const pageNo = Math.max(1, Number(page) || 1)
  return `${url}#page=${pageNo}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`
}

function clampPageCount(count) {
  return Math.max(1, Math.min(999, Number(count) || 1))
}
