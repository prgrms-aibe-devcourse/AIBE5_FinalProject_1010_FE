export function formatPrice(price) {
  return price != null ? price.toLocaleString('ko-KR') + '원' : '-'
}

export function formatDate(dateStr) {
  if (!dateStr) return '미정'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}
