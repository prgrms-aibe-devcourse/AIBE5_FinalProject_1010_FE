import { useState, useRef, useEffect } from 'react'

export default function useResizablePanel({
  initialWidth = 392,
  initialHeight = 584,
  initialRight = 28,
  initialBottom = 104,
  minWidth = 250,
  minHeight = 300
} = {}) {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [pos, setPos] = useState({ right: initialRight, bottom: initialBottom })
  
  // TODO: 터치 이벤트(모바일 리사이징) 지원 필요
  const isResizing = useRef(false)
  const resizeDir = useRef(null)
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0, r: 0, b: 0 })

  const handleMouseDown = (dir) => (e) => {
    isResizing.current = true
    resizeDir.current = dir
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
      r: pos.right,
      b: pos.bottom
    }
    e.preventDefault()
    document.body.style.cursor = getCursorForDir(dir)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return

      const { x, y, w, h, r, b } = startRef.current
      const dir = resizeDir.current
      const dx = e.clientX - x
      const dy = e.clientY - y

      let newW = w
      let newH = h
      let newR = r
      let newB = b

      // Top Edge
      if (dir.includes('t')) {
        newH = Math.max(minHeight, h - dy)
      }
      // Bottom Edge
      if (dir.includes('b')) {
        newH = Math.max(minHeight, h + dy)
        newB = b - (newH - h) // Adjust bottom so top edge stays fixed
      }
      // Left Edge
      if (dir.includes('l')) {
        newW = Math.max(minWidth, w - dx)
      }
      // Right Edge
      if (dir.includes('r')) {
        newW = Math.max(minWidth, w + dx)
        newR = r - (newW - w) // Adjust right so left edge stays fixed
      }

      setSize({ width: newW, height: newH })
      setPos({ right: newR, bottom: newB })
    }

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false
        resizeDir.current = null
        document.body.style.cursor = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [minWidth, minHeight])

  return {
    style: {
      width: `${size.width}px`,
      height: `${size.height}px`,
      right: `${pos.right}px`,
      bottom: `${pos.bottom}px`
    },
    handleMouseDown
  }
}

function getCursorForDir(dir) {
  switch (dir) {
    case 't': case 'b': return 'ns-resize'
    case 'l': case 'r': return 'ew-resize'
    case 'tl': case 'br': return 'nwse-resize'
    case 'tr': case 'bl': return 'nesw-resize'
    default: return ''
  }
}
