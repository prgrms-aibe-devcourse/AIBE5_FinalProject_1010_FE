/**
 * Toss redirects can attach query params before or after the hash fragment.
 * HashRouter reads only the hash-side query, so merge both locations explicitly.
 */
export function getPaymentRedirectParams(routerSearchParams) {
  const merged = new URLSearchParams(window.location.search)
  const hash = window.location.hash || ''
  const hashQueryStart = hash.indexOf('?')

  if (hashQueryStart >= 0) {
    const hashParams = new URLSearchParams(hash.slice(hashQueryStart + 1))
    hashParams.forEach((value, key) => merged.set(key, value))
  }

  routerSearchParams?.forEach?.((value, key) => merged.set(key, value))

  return merged
}
