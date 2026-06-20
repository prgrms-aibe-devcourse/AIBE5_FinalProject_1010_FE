import { pdfViewerUrl } from './pdf.js'

export default function PdfBackground({ activePdf, transparent }) {
  if (transparent) return null

  if (!activePdf) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#f8fafc', pointerEvents: 'none', overflow: 'hidden' }}>
      <iframe
        key={`${activePdf.src}-${activePdf.pdfPage}`}
        title={activePdf.fileName || 'PDF'}
        src={pdfViewerUrl(activePdf.src, activePdf.pdfPage)}
        scrolling="no"
        style={{ width: 'calc(100% + 18px)', height: '100%', border: 'none', background: '#fff', pointerEvents: 'none', display: 'block' }}
      />
    </div>
  )
}
