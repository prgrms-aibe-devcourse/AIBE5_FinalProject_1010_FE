export default function AccSection({ id, title, summary, active, open, onToggle, children }) {
  return (
    <div className={`facc${open ? ' facc--open' : ''}`}>
      <button type="button" className="facc__head" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="facc__title">{title}</span>
        <span className={`facc__summary${active ? ' facc__summary--active' : ''}`}>{summary}</span>
        <span className="facc__caret">▾</span>
      </button>
      {open && <div className="facc__body">{children}</div>}
    </div>
  )
}
