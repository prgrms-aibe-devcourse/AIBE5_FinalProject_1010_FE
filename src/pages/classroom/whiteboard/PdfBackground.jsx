import { pdfViewerUrl } from './pdf.js'
import { DEFAULT_VIEW, viewCssTransform } from './viewTransform.js'

export default function PdfBackground({ activePdf, transparent, view = DEFAULT_VIEW }) {
  if (transparent) return null

  if (!activePdf) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px`, pointerEvents: 'none' }} />
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#f8fafc', pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: viewCssTransform(view), transformOrigin: '0 0' }}>
        <iframe
          key={`${activePdf.src}-${activePdf.pdfPage}`}
          title={activePdf.fileName || 'PDF'}
          src={pdfViewerUrl(activePdf.src, activePdf.pdfPage)}
          scrolling="no"
          style={{ width: 'calc(100% + 18px)', height: '100%', border: 'none', background: '#fff', pointerEvents: 'none', display: 'block' }}
        />
      </div>
    </div>
  )
}
