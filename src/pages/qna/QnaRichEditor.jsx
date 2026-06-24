/**
 * @file QnaRichEditor.jsx
 * @description 티스토리식 본문 에디터. 하나의 편집 영역(contentEditable)에서 글을 쓰고,
 *              "사진"을 넣으면 현재 커서 위치에 이미지가 인라인으로 삽입된다. 이미지는 글자처럼
 *              취급되어 백스페이스로 지우거나 드래그로 옮길 수 있다(브라우저 기본 동작).
 *
 * 제출 시 편집 영역 DOM을 순서대로 훑어 백엔드가 기대하는 blocks 배열로 직렬화한다.
 *  - 텍스트 → { type:'text', text }
 *  - 이미지 → { type:'image', fileId }   (새 이미지는 업로드 후 fileId 획득)
 *
 * 부모는 ref로 editorRef.current.extract() 를 호출해 { blocks, content }를 얻는다.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { prepareImageForUpload, toAbsoluteFileUrl, uploadQnaImage } from '../../api/fileApi.js'

let seq = 0
const nextTempId = () => `t${(seq += 1)}-${Date.now()}`

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 백엔드 detail.blocks(또는 answer.blocks)를 초기 HTML로 변환한다. 레거시(content+images)도 처리. */
function initialHtml({ blocks, content, images }) {
  const out = []
  if (Array.isArray(blocks) && blocks.length > 0) {
    for (const b of blocks) {
      if (b.type === 'image') out.push(imageHtml(b.fileId, b.url))
      else out.push(textHtml(b.text || ''))
    }
  } else {
    if (content) out.push(textHtml(content))
    ;(images || []).forEach((img) => out.push(imageHtml(img.fileId, img.url)))
  }
  return out.join('')
}

/** 좌표 → 커서 Range. Chrome/Edge는 caretRangeFromPoint, Firefox는 caretPositionFromPoint 사용. */
function caretRangeFromPoint(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y)
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y)
    if (!pos) return null
    const range = document.createRange()
    range.setStart(pos.offsetNode, pos.offset)
    range.collapse(true)
    return range
  }
  return null
}

const textHtml = (text) => `<div>${escapeHtml(text).replace(/\n/g, '<br>') || '<br>'}</div>`
const imageHtml = (fileId, url) =>
  `<img class="qna-rich__img"${fileId != null ? ` data-file-id="${fileId}"` : ''} src="${url ? toAbsoluteFileUrl(url) : ''}" alt="첨부 이미지">`

const QnaRichEditor = forwardRef(function QnaRichEditor({ initial, placeholder }, ref) {
  const editorRef = useRef(null)
  const savedRange = useRef(null) // 버튼 클릭으로 포커스를 잃기 전 커서 위치 보존
  const filesByTemp = useRef(new Map()) // 새 이미지: tempId → File
  const objectUrls = useRef(new Set())
  const fileInputRef = useRef(null)

  // 최초 1회 초기 내용 주입 (수정 모드). contentEditable은 React가 관리하지 않으므로 직접 innerHTML.
  useEffect(() => {
    if (editorRef.current && initial) editorRef.current.innerHTML = initialHtml(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  /** 현재(또는 저장된) 커서 위치에 노드를 삽입하고 커서를 그 뒤로 옮긴다. */
  const insertNodeAtCaret = (node) => {
    const editor = editorRef.current
    editor.focus()
    const sel = window.getSelection()
    let range
    if (savedRange.current && editor.contains(savedRange.current.commonAncestorContainer)) {
      range = savedRange.current
    } else if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0)
    } else {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false) // 맨 끝
    }
    range.deleteContents()
    range.insertNode(node)
    // 이미지 뒤에 커서를 두기 위한 공백 텍스트
    const spacer = document.createTextNode(' ')
    node.after(spacer)
    range.setStartAfter(spacer)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    saveSelection()
  }

  const insertImageFile = (file) => {
    const url = URL.createObjectURL(file)
    objectUrls.current.add(url)
    const tempId = nextTempId()
    filesByTemp.current.set(tempId, file)
    const img = document.createElement('img')
    img.className = 'qna-rich__img'
    img.src = url
    img.alt = '첨부 이미지'
    img.setAttribute('data-temp', tempId)
    insertNodeAtCaret(img)
  }

  const addImages = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    picked.forEach(insertImageFile)
  }

  const onPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || [])
    const images = items.filter((it) => it.type.startsWith('image/'))
    if (images.length > 0) {
      e.preventDefault()
      images.forEach((it) => {
        const f = it.getAsFile()
        if (f) insertImageFile(f)
      })
    }
  }

  const onDrop = (e) => {
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return // 이미지 외(예: 기존 이미지 이동)는 브라우저 기본 동작에 맡긴다
    e.preventDefault()
    // 드롭 지점으로 커서 이동 후 삽입 (Firefox 포함 크로스브라우저)
    const range = caretRangeFromPoint(e.clientX, e.clientY)
    if (range && editorRef.current.contains(range.commonAncestorContainer)) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      savedRange.current = range.cloneRange()
    }
    files.forEach(insertImageFile)
  }

  useImperativeHandle(ref, () => ({
    /** 편집 영역을 blocks 배열로 직렬화한다. 새 이미지는 업로드해 fileId를 채운다. */
    async extract() {
      const editor = editorRef.current
      const items = []
      let buf = ''
      const flush = () => {
        const text = buf.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim()
        if (text) items.push({ type: 'text', text })
        buf = ''
      }
      const isBlock = (el) => /^(DIV|P|LI|UL|OL|BLOCKQUOTE|H[1-6])$/.test(el.nodeName)
      const walk = (node) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            buf += child.nodeValue
          } else if (child.nodeName === 'IMG') {
            flush()
            const fileId = child.getAttribute('data-file-id')
            items.push({ type: 'image', fileId: fileId != null ? Number(fileId) : null, tempId: child.getAttribute('data-temp') })
          } else if (child.nodeName === 'BR') {
            buf += '\n'
          } else {
            const block = child.nodeType === Node.ELEMENT_NODE && isBlock(child)
            if (block && buf && !buf.endsWith('\n')) buf += '\n'
            walk(child)
            if (block && buf && !buf.endsWith('\n')) buf += '\n'
          }
        })
      }
      walk(editor)
      flush()

      // 새 이미지 업로드 → fileId
      const blocks = []
      for (const it of items) {
        if (it.type === 'text') {
          blocks.push({ type: 'text', text: it.text })
        } else {
          let fileId = it.fileId
          if (fileId == null && it.tempId && filesByTemp.current.has(it.tempId)) {
            try {
              const prepared = await prepareImageForUpload(filesByTemp.current.get(it.tempId))
              const uploaded = await uploadQnaImage(prepared)
              fileId = uploaded?.fileId
            } catch {
              throw new Error('첨부 이미지 업로드에 실패했어요. 잠시 후 다시 시도해주세요.')
            }
          }
          // 업로드 실패/누락 이미지를 조용히 빼지 않고, 사용자에게 알리고 제출을 막는다
          if (fileId == null) {
            throw new Error('일부 이미지를 업로드하지 못했어요. 해당 이미지를 지우거나 다시 추가해주세요.')
          }
          blocks.push({ type: 'image', fileId })
        }
      }
      const content = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n\n')
      return { blocks, content }
    },
    clear() {
      if (editorRef.current) editorRef.current.innerHTML = ''
      filesByTemp.current.clear()
    },
  }))

  return (
    <div className="qna-rich">
      <div className="qna-rich__toolbar">
        <button type="button" className="qna-rich__tool" onMouseDown={(e) => { e.preventDefault(); saveSelection() }} onClick={() => fileInputRef.current?.click()}>
          🖼 사진
        </button>
        <span className="qna-rich__hint">글을 쓰다가 커서 위치에 사진을 넣거나, 이미지를 붙여넣기/드래그해도 돼요.</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addImages(e.target.files)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      </div>

      <div
        ref={editorRef}
        className="qna-rich__editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || '여기에 질문 내용을 작성하세요. 사진은 원하는 위치에 바로 넣을 수 있어요.'}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onPaste={onPaste}
        onDrop={onDrop}
      />
    </div>
  )
})

export default QnaRichEditor

/** 읽기 전용 렌더러. detail.blocks / answer.blocks를 순서대로 글·이미지로 표시한다. */
export function QnaBlockView({ blocks }) {
  return (
    <div className="qna-content">
      {blocks.map((b, i) =>
        b.type === 'image' ? (
          <img key={`img-${b.fileId ?? i}`} className="qna-content__image" src={toAbsoluteFileUrl(b.url)} alt={`첨부 ${i + 1}`} />
        ) : (
          <p key={`txt-${i}`} className="qna-content__text">{b.text}</p>
        ),
      )}
    </div>
  )
}
