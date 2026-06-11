/**
 * @file Whiteboard.jsx
 * @description 강의실 중앙 화이트보드 — <canvas> 기반 로컬 필기 (펜/지우개/색/전체지우기).
 * - 도구·색은 부모(ClassroomRoom)가 좌측 툴바에서 관리해 props로 내려준다.
 * - 실시간 공유(다른 참가자와 동기화)는 후속 작업. 지금은 내 화면에만 그려진다.
 * @param {{tool?:'pen'|'eraser', color?:string, clearNonce?:number}} props
 *   clearNonce: 값이 바뀔 때마다 전체 지우기를 수행(전체지우기 버튼이 증가시킴)
 */
import { useEffect, useRef } from 'react'

const PEN_WIDTH = 3
const ERASER_WIDTH = 24

export default function Whiteboard({ tool = 'pen', color = '#111111', clearNonce = 0 }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  // 이벤트 핸들러는 1회만 등록하므로, 최신 도구/색을 ref로 읽는다.
  const toolRef = useRef(tool)
  const colorRef = useRef(color)
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])

  // 캔버스 크기/컨텍스트 초기화 (devicePixelRatio 반영해 선명하게)
  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas.parentElement

    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = parent.clientHeight
      // width/height 지정 시 캔버스가 초기화되고 변환행렬도 identity로 리셋된다.
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr) // 이후 좌표는 CSS 픽셀 기준
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
    }

    fit()
    // 주의: 리사이즈 시 캔버스가 비워진다(MVP). 필요하면 스냅샷 보존을 추가.
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // 전체 지우기 (clearNonce 변화 시)
  useEffect(() => {
    if (clearNonce === 0) return
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [clearNonce])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleDown(e) {
    drawing.current = true
    last.current = getPos(e)
    canvasRef.current.setPointerCapture(e.pointerId)
    // 점 한 번만 찍어도 자국이 남도록 시작점에 짧은 선을 긋는다.
    drawSegment(last.current, last.current)
  }

  function handleMove(e) {
    if (!drawing.current) return
    const p = getPos(e)
    drawSegment(last.current, p)
    last.current = p
  }

  function handleUp() {
    drawing.current = false
  }

  function drawSegment(from, to) {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.beginPath()
    if (toolRef.current === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = ERASER_WIDTH
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = colorRef.current
      ctx.lineWidth = PEN_WIDTH
    }
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  return (
    <div style={{ height: '100%', background: '#fff', position: 'relative' }}>
      {/* 미세 도트 그리드 배경 (필기 보조) — 포인터 이벤트는 캔버스로 통과 */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          touchAction: 'none', // 터치 드로잉 시 스크롤 방지
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
        }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      />
    </div>
  )
}
