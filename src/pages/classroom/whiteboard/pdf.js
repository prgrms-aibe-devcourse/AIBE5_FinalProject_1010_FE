/**
 * PDF 파일의 실제 페이지 수를 읽는다.
 *
 * 1순위는 브라우저 PDF 뷰어와 같은 계열의 PDF.js 파서다. 단순히 텍스트에서
 * `/Type /Page`를 세면 가로 PDF나 변환된 PDF에서 리소스/중복 객체까지 페이지로
 * 오인할 수 있어서 실제보다 2배 이상 크게 나오는 문제가 있었다.
 *
 * PDF.js가 실패하는 특수 파일에 한해서만 아래 구조 파서를 fallback으로 사용한다.
 */
export async function readPdfPageCount(file) {
  if (!file) return 1

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2d
  if (!isPdf) throw new Error('PDF 파일만 추가할 수 있습니다.')

  const buffer = await file.arrayBuffer()
  const pdfJsCount = await readPdfJsPageCount(buffer)
  if (pdfJsCount) return clampPageCount(pdfJsCount)

  // fallback: PDF.js가 읽지 못한 경우에도 수업 진행을 막지 않도록 PDF 객체 구조를 직접 훑는다.
  const text = new TextDecoder('latin1').decode(buffer)
  const objects = parsePdfObjects(text)
  const treeCount = readPageTreeCount(text, objects)
  if (treeCount) return clampPageCount(treeCount)

  // `/Type /Pages` 노드의 Count는 `/Type /Page` 문자열 개수보다 안전하다.
  // 다만 루트 페이지 트리를 못 찾은 상황이므로 가장 큰 Count만 보조적으로 사용한다.
  const pagesNodeCounts = [...objects.values()]
    .filter((body) => /\/Type\s*\/Pages\b/.test(body))
    .map((body) => numberAfter(body, 'Count'))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (pagesNodeCounts.length) return clampPageCount(Math.max(...pagesNodeCounts))

  // 마지막 fallback. 실제 페이지 객체로 파싱된 object만 세고, 원문 전체의 `/Type /Page` 문자열은 세지 않는다.
  const uniquePageObjects = [...objects.values()].filter((body) => /\/Type\s*\/Page\b/.test(body)).length
  if (uniquePageObjects) return clampPageCount(uniquePageObjects)

  return 1
}

export function pdfViewerUrl(url, page = 1) {
  if (!url) return ''
  const pageNo = Math.max(1, Number(page) || 1)
  return `${url}#page=${pageNo}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`
}

function clampPageCount(count) {
  return Math.max(1, Math.min(999, Number(count) || 1))
}

async function readPdfJsPageCount(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    // 업로드 직후 페이지 수만 필요하므로 worker를 끄고 현재 스레드에서 짧게 파싱한다.
    // worker 파일 경로 설정 문제를 피할 수 있고, 번들 환경(Vite)에서도 안정적으로 동작한다.
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer.slice(0)),
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
    }).promise
    return doc.numPages
  } catch (e) {
    console.warn('[whiteboard] PDF.js page count failed, falling back to structural parser', e)
    return null
  }
}

/**
 * 압축되지 않은 일반 PDF object를 모아둔다.
 * object stream 안에 들어간 고급 구조는 PDF.js가 처리하고, 이 함수는 fallback 용도만 담당한다.
 */
function parsePdfObjects(text) {
  const objects = new Map()
  const re = /(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bendobj/g
  let match
  while ((match = re.exec(text))) {
    objects.set(`${match[1]} ${match[2]}`, match[3])
  }
  return objects
}

/**
 * Catalog(/Root)에서 Pages 루트를 따라가며 페이지 트리의 Count를 읽는다.
 * PDF 표준 구조를 따라가는 방식이라 단순 문자열 개수보다 정확하다.
 */
function readPageTreeCount(text, objects) {
  const rootRefs = [...text.matchAll(/\/Root\s+(\d+)\s+(\d+)\s+R/g)]
  const rootRef = rootRefs[rootRefs.length - 1]
  if (!rootRef) return null

  const catalog = objects.get(`${rootRef[1]} ${rootRef[2]}`)
  const pagesRef = catalog ? refAfter(catalog, 'Pages') : null
  if (!pagesRef) return null

  return resolvePagesCount(objects, pagesRef, new Set())
}

/**
 * Pages 트리를 재귀적으로 따라간다.
 * Count가 있으면 그대로 쓰고, Count가 빠진 비정상 구조면 Kids를 내려가며 Page 노드를 합산한다.
 */
function resolvePagesCount(objects, ref, visited) {
  const key = `${ref.obj} ${ref.gen}`
  if (visited.has(key)) return null
  visited.add(key)

  const body = objects.get(key)
  if (!body) return null
  if (/\/Type\s*\/Page\b/.test(body)) return 1

  if (/\/Type\s*\/Pages\b/.test(body)) {
    const count = numberAfter(body, 'Count')
    if (Number.isFinite(count) && count > 0) return count

    const kids = refsInKids(body)
    if (!kids.length) return null
    const total = kids.reduce((sum, kid) => sum + (resolvePagesCount(objects, kid, visited) || 0), 0)
    return total > 0 ? total : null
  }

  return null
}

function refAfter(text, key) {
  const re = new RegExp(`/${key}\\s+(\\d+)\\s+(\\d+)\\s+R`)
  const match = text.match(re)
  return match ? { obj: match[1], gen: match[2] } : null
}

function refsInKids(text) {
  const kidsMatch = text.match(/\/Kids\s*\[([\s\S]*?)\]/)
  if (!kidsMatch) return []
  return [...kidsMatch[1].matchAll(/(\d+)\s+(\d+)\s+R/g)].map((m) => ({ obj: m[1], gen: m[2] }))
}

function numberAfter(text, key) {
  const re = new RegExp(`/${key}\\s+(-?\\d+)`)
  const match = text.match(re)
  return match ? Number(match[1]) : null
}
