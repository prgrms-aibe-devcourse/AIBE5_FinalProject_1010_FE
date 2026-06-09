/**
 * @file datetime.js
 * @description 날짜/시각 표시용 유틸. (API 모듈과 분리한 UI 헬퍼)
 */

/** ISO 시각을 "방금 전 / n분 전 / n시간 전 / n일 전 / 날짜"로 표현한다. */
export function formatRelativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMin = Math.floor((Date.now() - then) / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}
