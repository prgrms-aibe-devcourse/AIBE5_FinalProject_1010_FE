export const formatPrice = (price) =>
  new Intl.NumberFormat('ko-KR').format(price) + '원'

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('ko-KR')
