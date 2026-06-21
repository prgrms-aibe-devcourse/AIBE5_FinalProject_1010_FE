export function ToastBanner({ toast }) {
  if (!toast) return null
  return (
    <div role="alert" style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#111827', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', maxWidth: '80%', textAlign: 'center', pointerEvents: 'none' }}>
      {toast}
    </div>
  )
}

export function MarqueeSelection({ marquee }) {
  if (!marquee) return null
  return (
    <div style={{ position: 'absolute', left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, border: '1px dashed #2563eb', background: 'rgba(37,99,235,0.08)', zIndex: 4, pointerEvents: 'none' }} />
  )
}

export function EraserCursor({ show, eraserCursor, eraseRadius }) {
  if (!show || !eraserCursor) return null
  return (
    <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', left: eraserCursor.x - eraseRadius, top: eraserCursor.y - eraseRadius, width: eraseRadius * 2, height: eraseRadius * 2, borderRadius: '50%', border: '1.5px solid #6b7280', background: 'rgba(148,163,184,0.18)' }} />
  )
}

export function RotationHud({ rotHud, degText, onFocus, onBlur, onChange }) {
  if (!rotHud) return null
  return (
    <div style={{ position: 'absolute', left: rotHud.x, top: rotHud.y - 32, transform: 'translateX(-50%)', zIndex: 8, background: '#111827', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', pointerEvents: 'auto' }}>
      <input value={degText} onFocus={onFocus} onBlur={onBlur} onChange={onChange} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} title="회전 각도(도)" style={{ width: 36, border: 'none', borderRadius: 4, padding: '1px 3px', fontSize: 11, textAlign: 'right' }} /><span>°</span>
    </div>
  )
}

export function TextEditorOverlay({
  editing,
  inputRef,
  composingRef,
  setEditing,
  commitText,
  bold,
  fontSize,
  fontFamily,
  color,
}) {
  if (!editing) return null
  return (
    <textarea
      key={editing.id || `${Math.round(editing.x)}_${Math.round(editing.y)}`}
      ref={inputRef}
      autoFocus
      value={editing.value}
      onChange={(e) => setEditing((ed) => (ed ? { ...ed, value: e.target.value } : ed))}
      onBlur={commitText}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.nativeEvent.isComposing || composingRef.current) return
        if (e.key === 'Escape') { e.preventDefault(); setEditing(null) }
      }}
      rows={Math.max(1, String(editing.value || '').split('\n').length)}
      placeholder="텍스트 입력 (Enter=줄바꿈, 영역 밖 클릭=완료)"
      style={{ position: 'absolute', left: editing.x, top: editing.y, zIndex: 9, font: `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`, color, lineHeight: 1.25, border: '1px dashed #2563eb', background: 'rgba(255,255,255,0.97)', padding: '2px 4px', outline: 'none', minWidth: 180, minHeight: Math.round(fontSize * 1.5), resize: 'both', overflow: 'auto', whiteSpace: 'pre-wrap', pointerEvents: 'auto' }}
    />
  )
}
