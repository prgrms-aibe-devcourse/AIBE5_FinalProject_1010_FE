export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4
export const DEFAULT_VIEW = { scale: 1, x: 0, y: 0 }

export const clampZoom = (scale) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale))

export const screenToBoard = (point, view) => ({
  x: (point.x - view.x) / view.scale,
  y: (point.y - view.y) / view.scale,
})

export const boardToScreen = (point, view) => ({
  x: point.x * view.scale + view.x,
  y: point.y * view.scale + view.y,
})

export const zoomAtScreenPoint = (view, screenPoint, factor) => {
  const nextScale = clampZoom(view.scale * factor)
  if (nextScale === view.scale) return view

  const boardPoint = screenToBoard(screenPoint, view)
  return {
    scale: nextScale,
    x: screenPoint.x - boardPoint.x * nextScale,
    y: screenPoint.y - boardPoint.y * nextScale,
  }
}

export const viewCssTransform = (view) =>
  `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
