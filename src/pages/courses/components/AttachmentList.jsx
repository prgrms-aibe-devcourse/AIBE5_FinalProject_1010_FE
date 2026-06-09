import { attachmentIcon, fmtBytes, toAbsoluteUrl } from '../courseUtils.js'

/**
 * 첨부파일 다운로드 링크 목록 (읽기 전용).
 * 공지사항 상세 / 게시글 상세 공용.
 */
export default function AttachmentList({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div className="notice-attachments">
      {attachments.map((a, i) => (
        <a
          key={i}
          href={toAbsoluteUrl(a.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="notice-attach-link"
          download={a.originalFileName}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{attachmentIcon(a.contentType)}</span>
          <span className="notice-attach-name">{a.originalFileName}</span>
          <span className="notice-attach-size">{fmtBytes(a.fileSize)}</span>
        </a>
      ))}
    </div>
  )
}
