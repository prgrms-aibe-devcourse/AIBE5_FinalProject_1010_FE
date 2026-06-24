/**
 * @file whiteboard/constants.js
 * @description 화이트보드 공용 상수 및 id 생성기.
 */
export const TEXT_SIZE = 20
export const HIT_PAD = 6      // 선택 히트박스 여유(px)
export const HANDLE = 10      // 크기조절 핸들 한 변(px)
export const ROT_OFFSET = 24  // 회전 핸들이 박스 위로 떨어진 거리
export const ROT_HIT = 10     // 회전 핸들 클릭 허용 반경

export const FONTS = [
  { label: '기본', value: 'sans-serif' }, { label: '명조', value: 'serif' },
  { label: '고정폭', value: 'monospace' }, { label: '손글씨', value: "'Jua', sans-serif" },
]
export const FONT_SIZES = [14, 20, 28, 40, 56]
export const POLYGON_MIN = 3
export const POLYGON_MAX = 12

// PDF 배경을 모든 참가자가 공유하는 "고정 board 영역"으로 배치하기 위한 기준값(PDF 필기 정렬).
// 필기는 board 좌표로 저장·동기화되므로, PDF를 각자 화면 크기에 맞추지 않고 이 고정 박스에 렌더하면
// 화면 크기가 다른 참가자끼리도 PDF 위 필기 위치가 정확히 일치한다(정규화 좌표 효과).
export const PDF_BOARD_WIDTH = 1500          // PDF 배경 박스의 board 가로 폭(px) — 클수록 렌더 해상도↑(더 선명)
export const PDF_DEFAULT_RATIO = 1.4142      // 높이/너비 기본값(A4 세로). 페이지 크기 파악 실패 시 사용
export const BOX_TYPES = ['rect', 'ellipse', 'triangle', 'polygon'] // x,y,w,h 기반 도형
export const VIEW_TOOLS = ['hand', 'zoomIn', 'zoomOut']
export const isViewTool = (tool) => VIEW_TOOLS.includes(tool)

// 회전 커서(원형 화살표 SVG). 미지원 시 grab 폴백.
export const ROTATE_CURSOR = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12a7 7 0 1 1 2.05 4.95'/><path d='M3 14l2.2 2.6L8 14'/></g></svg>\") 12 12, grab"

export const layerBtn = { width: 18, height: 18, lineHeight: '16px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, flex: '0 0 auto' }

/** pen/curve 처럼 points 배열 기반 도형인가 */
export const isPath = (s) => s.type === 'pen' || s.type === 'curve'

// 클라이언트(탭)마다 고유한 prefix를 둬서 여러 참가자가 동시에 만들어도 도형/페이지 id가 충돌하지 않게 한다.
// (서버 권위 동기화에서 id는 전역 식별자로 쓰이므로 충돌하면 안 됨)
let _id = 0
const _prefix = `c${Math.random().toString(36).slice(2, 8)}_`
export const nextId = () => `${_prefix}${++_id}`
