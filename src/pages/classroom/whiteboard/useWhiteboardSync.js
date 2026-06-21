import { useEffect, useRef } from 'react'
import { connectChat, onSocketStatus, sendWhiteboard, subscribeWhiteboard } from '../../../api/chatSocket.js'
import { fetchWhiteboardSnapshot } from '../../../api/classroomApi.js'
import { getCurrentUserId } from '../../../auth/currentUser.js'
import { pageMetaOf } from './pageModel.js'
import { applyOps, buildPrev, createHydrator, serShape } from './syncState.js'

export function useWhiteboardSync({
  pages,
  setPages,
  sessionId,
  draft,
  curveHover,
  redraw,
  activePageIdRef,
  remoteLiveRef,
  setFollowPageId,
}) {
  const myIdRef = useRef(getCurrentUserId())
  const pagesRef = useRef(pages)
  const sessionIdRef = useRef(sessionId)
  const prevSentRef = useRef(new Map())
  const lastSeqRef = useRef(0)
  const resyncingRef = useRef(false)
  const opTimerRef = useRef(null)
  const liveLastRef = useRef(0)
  const liveSentNullRef = useRef(false)
  const hydrate = createHydrator(redraw)

  useEffect(() => { pagesRef.current = pages }, [pages])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  const flushOps = () => {
    if (sessionIdRef.current == null) return
    const cur = pagesRef.current
    const prev = prevSentRef.current, ops = [], seen = new Set()
    cur.forEach((pg) => {
      seen.add(pg.id)
      const p = prev.get(pg.id)
      if (!p) {
        ops.push({
          op: 'addPage',
          pageId: pg.id,
          kind: pg.kind || 'board',
          pdfDocId: pg.pdfDocId ?? null,
          pdfPage: pg.pdfPage ?? null,
          pdfPageCount: pg.pdfPageCount ?? null,
          pdfSrc: pg.pdfSrc ?? null,
          fileName: pg.fileName ?? null,
        })
        pg.shapes.forEach((s) => ops.push({ op: 'add', pageId: pg.id, shape: serShape(s, false) }))
        return
      }
      if (p.ref === pg.shapes) return
      const curMap = new Map(pg.shapes.map((s) => [s.id, s]))
      pg.shapes.forEach((s) => { if (!p.map.has(s.id)) ops.push({ op: 'add', pageId: pg.id, shape: serShape(s, false) }); else if (p.map.get(s.id) !== s) ops.push({ op: 'update', pageId: pg.id, shape: serShape(s, true) }) })
      p.map.forEach((_, id) => { if (!curMap.has(id)) ops.push({ op: 'remove', pageId: pg.id, id }) })
      const curOrder = pg.shapes.map((s) => s.id).join(','), prevOrder = [...p.map.keys()].join(',')
      if (curOrder !== prevOrder && pg.shapes.length === p.map.size) ops.push({ op: 'reorder', pageId: pg.id, ids: pg.shapes.map((s) => s.id) })
    })
    prev.forEach((_, pageId) => { if (!seen.has(pageId)) ops.push({ op: 'removePage', pageId }) })
    prevSentRef.current = buildPrev(cur)
    if (ops.length) sendWhiteboard(sessionIdRef.current, { type: 'ops', ops })
  }

  useEffect(() => {
    if (sessionId == null) return
    if (!opTimerRef.current) opTimerRef.current = setTimeout(() => { opTimerRef.current = null; flushOps() }, 50)
  }, [pages, sessionId])

  useEffect(() => {
    if (sessionId == null) return
    if (!draft) {
      if (!liveSentNullRef.current) {
        sendWhiteboard(sessionIdRef.current, { type: 'live', shape: null })
        liveSentNullRef.current = true
      }
      return
    }
    liveSentNullRef.current = false
    const now = performance.now()
    if (now - liveLastRef.current < 45) return
    liveLastRef.current = now
    let d = draft
    if (d.type === 'curve' && curveHover) d = { ...d, points: [...d.points, curveHover] }
    sendWhiteboard(sessionIdRef.current, { type: 'live', shape: { ...d, _img: undefined }, pageId: activePageIdRef.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, curveHover, sessionId])

  const resync = () => {
    const sid = sessionIdRef.current
    if (sid == null || resyncingRef.current) return
    resyncingRef.current = true
    fetchWhiteboardSnapshot(sid).then((res) => {
      const board = res?.board
      if (!board) return
      const loaded = (board.pages || []).map((pg) => {
        const meta = pageMetaOf(pg)
        return {
          id: pg.id,
          kind: meta.kind,
          pdfDocId: meta.pdfDocId,
          pdfPage: meta.pdfPage,
          pdfPageCount: meta.pdfPageCount,
          pdfSrc: meta.pdfSrc,
          fileName: meta.fileName,
          shapes: (pg.shapes || []).map(hydrate),
        }
      })
      lastSeqRef.current = board.seq || 0
      prevSentRef.current = buildPrev(loaded)
      setPages(loaded.length ? loaded : [{ id: 'p1', kind: 'board', shapes: [] }])
      if (board.activePageId) setFollowPageId(board.activePageId)
    }).catch(() => {}).finally(() => { resyncingRef.current = false })
  }

  const applyRemote = (msg) => {
    if (!msg) return
    if (msg.type === 'page') { if (msg.pageId) setFollowPageId(msg.pageId); return }
    if (msg.type === 'live') {
      if (msg.senderId === myIdRef.current) return
      if (msg.shape) remoteLiveRef.current[msg.senderId] = { shape: hydrate(msg.shape), pageId: msg.pageId }
      else delete remoteLiveRef.current[msg.senderId]
      redraw()
      return
    }
    if (msg.type !== 'ops' || !Array.isArray(msg.ops)) return

    const seq = msg.seq
    if (seq != null) {
      if (seq <= lastSeqRef.current) return
      if (seq !== lastSeqRef.current + 1) { resync(); return }
      lastSeqRef.current = seq
    }
    if (msg.senderId === myIdRef.current) return

    delete remoteLiveRef.current[msg.senderId]
    setPages((prevPages) => {
      const next = applyOps(prevPages, msg.ops, hydrate)
      prevSentRef.current = buildPrev(next)
      return next
    })
  }

  useEffect(() => {
    if (sessionId == null) return
    let cancelled = false, unsub = () => {}
    const onConn = () => {
      if (cancelled) return
      unsub(); unsub = subscribeWhiteboard(sessionId, applyRemote)
      resync()
    }
    const off = onSocketStatus((s) => { if (s === 'connected') onConn() })
    connectChat().then(onConn).catch(() => {})
    return () => { cancelled = true; unsub(); off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return { pagesRef, sessionIdRef, hydrate }
}
