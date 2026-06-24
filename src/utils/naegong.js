export function getNaegongTier(score) {
  if (score >= 1000) return { label: '마스터', cls: 'master' }
  if (score >= 500)  return { label: '고수',   cls: 'expert' }
  if (score >= 100)  return { label: '중수',   cls: 'mid'    }
  return                     { label: '초보',   cls: 'novice' }
}
