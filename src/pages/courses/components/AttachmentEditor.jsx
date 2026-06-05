import { attachmentIcon, fmtBytes } from '../courseUtils.js'

/**
 * 폼 내 첨부파일 추가/삭제 UI.
 * NoticeTab 작성폼 / BoardTab 작성폼 공용.
 */
export default function AttachmentEditor({
  pendingFiles,
  uploadedAttachments,
  uploading,
  uploadError,
  onAddFiles,
  onRemovePending,
  onRemoveUploaded,
  fileInputRef,
}) {
  return (
    <div className="form-group">
      <label className="db-form-label">
        첨부파일
        <span style={{ fontWeight: 400, color: 'var(--ink-mute)', fontSize: 12, marginLeft: 6 }}>
          이미지·PDF, 최대 20MB
        </span>
      </label>

      {(uploadedAttachments.length > 0 || pendingFiles.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          {uploadedAttachments.map((a, i) => (
            <div key={a.url ?? `up-${i}`} className="notice-attach-item notice-attach-item--done">
              <span>{attachmentIcon(a.contentType)}</span>
              <span className="notice-attach-name">{a.originalFileName}</span>
              <span className="notice-attach-size">{fmtBytes(a.fileSize)}</span>
              <button type="button" className="notice-attach-remove" onClick={() => onRemoveUploaded(i)}>✕</button>
            </div>
          ))}
          {pendingFiles.map((f, i) => (
            <div key={`pend-${i}`} className="notice-attach-item notice-attach-item--pending">
              <span>{attachmentIcon(f.type)}</span>
              <span className="notice-attach-name">{f.name}</span>
              <span className="notice-attach-size">{fmtBytes(f.size)}</span>
              <span className="notice-attach-badge">대기</span>
              <button type="button" className="notice-attach-remove" onClick={() => onRemovePending(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <p style={{ color: 'var(--coral-dark)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          ⚠️ {uploadError}
        </p>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        📎 파일 추가
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { onAddFiles(Array.from(e.target.files)); e.target.value = '' }}
      />
    </div>
  )
}
