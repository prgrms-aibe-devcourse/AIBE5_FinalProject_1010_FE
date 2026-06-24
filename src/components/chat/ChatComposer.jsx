/**
 * @file ChatComposer.jsx
 * @description 대화 화면 하단의 메시지 입력창입니다.
 * - Enter로 전송(Shift+Enter는 줄바꿈 의도라 무시), 한글 IME 조합 중 Enter 오작동을 방지합니다.
 * - 이미지 파일 선택과 드래그 앤 드롭 첨부, 전송 전 미리보기를 처리합니다.
 */
import { useRef, useState } from 'react'
import { IconClose, IconImage, IconSend } from './icons.jsx'

const IMAGE_NAME_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

function makeAttachmentKey(file) {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${file.name}-${file.size}-${file.lastModified}-${random}`
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve({
        key: makeAttachmentKey(file),
        name: file.name,
        size: file.size,
        type: file.type,
        url: reader.result,
      })
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getImageFiles(files) {
  return Array.from(files || []).filter(
    (file) => file.type.startsWith('image/') || IMAGE_NAME_PATTERN.test(file.name),
  )
}

/**
 * @param {string}   value    입력값
 * @param {function} onChange 입력 변경 핸들러
 * @param {function} onSend   전송 핸들러
 */
export default function ChatComposer({ value, onChange, onSend }) {
  // 한글 등 IME 조합 중인지 여부. 조합 중 Enter는 전송이 아니라 글자 확정이므로 막는다.
  const composingRef = useRef(false)
  const fileInputRef = useRef(null)
  const [attachments, setAttachments] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)

  const canSend = value.trim().length > 0 || attachments.length > 0

  async function addImageFiles(files) {
    const imageFiles = getImageFiles(files)
    if (imageFiles.length === 0) return

    setLoadingImages(true)

    try {
      const nextAttachments = await Promise.all(imageFiles.map(readImageFile))
      setAttachments((current) => [...current, ...nextAttachments])
    } catch (error) {
      console.error('이미지 첨부를 처리하지 못했습니다.', error)
    } finally {
      setLoadingImages(false)
    }
  }

  function handleSend() {
    if (!canSend) return

    onSend({
      text: value.trim(),
      attachments,
    })
    setAttachments([])
  }

  function removeAttachment(key) {
    setAttachments((current) => current.filter((item) => item.key !== key))
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    addImageFiles(e.dataTransfer.files)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`cw-composer ${dragging ? 'is-dragging' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
      }}
      onDrop={onDrop}
    >
      <div className="cw-drop-hint">이미지를 여기에 놓아 첨부</div>

      {attachments.length > 0 && (
        <div className="cw-preview-grid" aria-label="첨부 이미지 미리보기">
          {attachments.map((image) => (
            <div className="cw-preview" key={image.key}>
              <img src={image.url} alt={image.name || '첨부 이미지'} />
              <button
                className="cw-preview-remove"
                type="button"
                onClick={() => removeAttachment(image.key)}
                aria-label={`${image.name || '첨부 이미지'} 제거`}
              >
                <IconClose />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cw-compose-main">
        <input
          ref={fileInputRef}
          className="cw-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addImageFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          className="cw-attach-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="이미지 첨부"
        >
          <IconImage />
        </button>
        <input
          type="text"
          className="cw-input"
          placeholder={loadingImages ? '이미지를 불러오는 중...' : '메시지를 입력하세요'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
        />
        <button className="cw-send" onClick={handleSend} disabled={!canSend} aria-label="전송">
          <IconSend />
        </button>
      </div>
    </div>
  )
}
