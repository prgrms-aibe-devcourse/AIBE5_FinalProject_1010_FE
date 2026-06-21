export default function PageBar({
  activePdf,
  pageBarBottom,
  canDraw,
  boardPageEntries,
  currentBoardIndex,
  hasPdf,
  goToWhiteboard,
  goToPdf,
  prevPage,
  nextPage,
  addPage,
  pdfPageInput,
  onPdfPageFocus,
  onPdfPageBlur,
  onPdfPageChange,
  onPdfPageKeyDown,
  currentPdfPageNo,
  currentPdfPageCount,
  prevPdfPage,
  nextPdfPage,
  pdfDocIndex,
  pdfDocCount,
  prevPdfDoc,
  nextPdfDoc,
}) {
  const docArrowStyle = (enabled) => ({ border: 'none', background: 'transparent', cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.3, fontSize: 13, color: '#92400e', padding: '2px 2px' })
  return (
    <div style={{ position: 'absolute', bottom: pageBarBottom, left: '50%', transform: 'translateX(-50%)', zIndex: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, padding: '5px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13 }}>
      {activePdf ? (
        <>
          <button onClick={goToWhiteboard} disabled={!canDraw || boardPageEntries.length === 0} title={canDraw ? '화이트보드로 이동' : '선생님이 판서를 허용해야 화면을 바꿀 수 있어요'} style={{ border: '1px solid #2563eb', color: canDraw ? '#2563eb' : '#9ca3af', background: '#fff', borderRadius: 999, height: 26, padding: '0 11px', cursor: canDraw ? 'pointer' : 'default', opacity: canDraw ? 1 : 0.5, fontWeight: 800, whiteSpace: 'nowrap' }}>화이트보드로</button>
          <span style={{ width: 1, height: 18, background: '#e5e7eb' }} />
          {pdfDocCount > 1 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={prevPdfDoc} disabled={!canDraw || pdfDocIndex <= 0} title={canDraw ? '이전 PDF 문서' : '선생님이 판서를 허용해야 화면을 바꿀 수 있어요'} style={docArrowStyle(canDraw && pdfDocIndex > 0)}>◀</button>
              <span title={activePdf.fileName || 'PDF'} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, color: '#92400e' }}>PDF {Math.max(0, pdfDocIndex) + 1}/{pdfDocCount}</span>
              <button onClick={nextPdfDoc} disabled={!canDraw || pdfDocIndex >= pdfDocCount - 1} title={canDraw ? '다음 PDF 문서' : '선생님이 판서를 허용해야 화면을 바꿀 수 있어요'} style={docArrowStyle(canDraw && pdfDocIndex < pdfDocCount - 1)}>▶</button>
            </span>
          ) : (
            <span title={activePdf.fileName || 'PDF'} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, color: '#92400e' }}>PDF</span>
          )}
          <input
            value={pdfPageInput}
            disabled={!canDraw}
            inputMode="numeric"
            aria-label="PDF 페이지 번호"
            onFocus={onPdfPageFocus}
            onBlur={onPdfPageBlur}
            onChange={onPdfPageChange}
            onKeyDown={onPdfPageKeyDown}
            style={{ width: 52, height: 26, border: '1px solid #d1d5db', borderRadius: 7, padding: '0 6px', textAlign: 'center', fontWeight: 800, color: '#2563eb', background: canDraw ? '#fff' : '#f3f4f6', outline: 'none' }}
          />
          <span style={{ fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap' }}>/ {currentPdfPageCount || '?'}</span>
          <button onClick={prevPdfPage} disabled={!canDraw || currentPdfPageNo <= 1} title={canDraw ? '이전 PDF 페이지' : '선생님이 판서를 허용해야 페이지를 넘길 수 있어요'} style={{ border: 'none', background: 'transparent', cursor: (!canDraw || currentPdfPageNo <= 1) ? 'default' : 'pointer', opacity: (!canDraw || currentPdfPageNo <= 1) ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>◀</button>
          <button onClick={nextPdfPage} disabled={!canDraw || currentPdfPageNo >= currentPdfPageCount} title={canDraw ? '다음 PDF 페이지' : '선생님이 판서를 허용해야 페이지를 넘길 수 있어요'} style={{ border: 'none', background: 'transparent', cursor: (!canDraw || currentPdfPageNo >= currentPdfPageCount) ? 'default' : 'pointer', opacity: (!canDraw || currentPdfPageNo >= currentPdfPageCount) ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>▶</button>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 800, color: '#374151', whiteSpace: 'nowrap', minWidth: 92, textAlign: 'center' }}>
            화이트보드 <span style={{ color: '#2563eb' }}>{Math.max(0, currentBoardIndex) + 1}</span> / {boardPageEntries.length || 1}
          </span>
          <span style={{ width: 1, height: 18, background: '#e5e7eb' }} />
          <button onClick={prevPage} disabled={!canDraw || currentBoardIndex <= 0} title={canDraw ? '이전 화이트보드 페이지' : '선생님이 판서를 허용해야 페이지를 넘길 수 있어요'} style={{ border: 'none', background: 'transparent', cursor: (!canDraw || currentBoardIndex <= 0) ? 'default' : 'pointer', opacity: (!canDraw || currentBoardIndex <= 0) ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>◀</button>
          <button onClick={addPage} disabled={!canDraw} title={canDraw ? '화이트보드 페이지 추가' : '선생님이 판서를 허용해야 페이지를 추가할 수 있어요'} style={{ border: '1px solid #2563eb', color: canDraw ? '#2563eb' : '#9ca3af', background: '#fff', borderRadius: 6, height: 26, padding: '0 10px', cursor: canDraw ? 'pointer' : 'default', opacity: canDraw ? 1 : 0.5, fontWeight: 700, whiteSpace: 'nowrap' }}>＋ board</button>
          <button onClick={nextPage} disabled={!canDraw || currentBoardIndex < 0 || currentBoardIndex >= boardPageEntries.length - 1} title={canDraw ? '다음 화이트보드 페이지' : '선생님이 판서를 허용해야 페이지를 넘길 수 있어요'} style={{ border: 'none', background: 'transparent', cursor: (!canDraw || currentBoardIndex < 0 || currentBoardIndex >= boardPageEntries.length - 1) ? 'default' : 'pointer', opacity: (!canDraw || currentBoardIndex < 0 || currentBoardIndex >= boardPageEntries.length - 1) ? 0.3 : 1, fontSize: 15, color: '#374151', padding: '2px 4px' }}>▶</button>
          {hasPdf && (
            <>
              <span style={{ width: 1, height: 18, background: '#e5e7eb' }} />
              <button onClick={goToPdf} disabled={!canDraw} title={canDraw ? 'PDF 보기' : '선생님이 판서를 허용해야 화면을 바꿀 수 있어요'} style={{ border: '1px solid #f59e0b', color: canDraw ? '#92400e' : '#9ca3af', background: '#fffbeb', borderRadius: 999, height: 26, padding: '0 11px', cursor: canDraw ? 'pointer' : 'default', opacity: canDraw ? 1 : 0.5, fontWeight: 800, whiteSpace: 'nowrap' }}>PDF 보기</button>
            </>
          )}
        </>
      )}
    </div>
  )
}
