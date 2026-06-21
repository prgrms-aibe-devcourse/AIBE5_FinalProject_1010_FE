import { useEffect, useRef, useState } from 'react'
import { renderPdfPageToCanvas } from './pdf.js'
import { DEFAULT_VIEW, viewCssTransform } from './viewTransform.js'

/**
 * 화이트보드 배경(점선 그리드 또는 PDF).
 *
 * PDF는 PDF.js로 직접 캔버스에 렌더해 "고정 board 영역(activePdf.x/y/w/h)"을 정확히 채운다.
 * 이 박스는 전 참가자가 공통으로 쓰는 board 좌표라, 그 위에 board 좌표로 찍힌 필기는
 * 화면 크기와 무관하게 동일 위치에 정렬된다(네이티브 iframe 뷰어의 레터박스 불확실성 제거).
 * 박스/필기 모두 동일한 view 변환을 받으므로 줌·팬도 함께 움직인다.
 */
export default function PdfBackground({ activePdf, transparent, view = DEFAULT_VIEW }) {
  if (transparent) return null

  if (!activePdf) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px`, pointerEvents: 'none' }} />
    )
  }

  return <PdfPageLayer activePdf={activePdf} view={view} />
}

function PdfPageLayer({ activePdf, view }) {
  const { src, pdfPage = 1, x = 0, y = 0, w, h } = activePdf
  const hostRef = useRef(null)
  const reqRef = useRef(0)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false
    const reqId = ++reqRef.current
    setStatus('loading')
    // 표시 폭(w board px)의 약 2배 해상도로 렌더해 줌·고DPI에서도 선명하게(상한 3200).
    const targetWidth = Math.min(3200, Math.max(1200, Math.round((Number(w) || 1500) * 2)))
    renderPdfPageToCanvas(src, pdfPage, targetWidth)
      .then((canvas) => {
        if (cancelled || reqId !== reqRef.current) return
        const host = hostRef.current
        if (!host) return
        if (!canvas) { setStatus('error'); return }
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        host.replaceChildren(canvas)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [src, pdfPage, w])

  const boxStyle = { position: 'absolute', left: x, top: y, width: w, height: h }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#f1f5f9', pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transform: viewCssTransform(view), transformOrigin: '0 0' }}>
        <div ref={hostRef} style={{ ...boxStyle, background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.18)' }} />
        {status !== 'ready' && (
          <div style={{ ...boxStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: status === 'error' ? '#b91c1c' : '#94a3b8', fontSize: 16, fontWeight: 700, border: '1px solid #e2e8f0', background: '#fff' }}>
            {status === 'error' ? 'PDF를 불러오지 못했습니다.' : 'PDF 불러오는 중…'}
          </div>
        )}
      </div>
    </div>
  )
}
