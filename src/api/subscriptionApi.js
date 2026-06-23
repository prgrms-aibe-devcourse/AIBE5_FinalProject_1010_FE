import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

const BASE = `${API_BASE}/api/v1/subscriptions`

async function toJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    error.code = data?.code
    error.data = data
    throw error
  }
  return data
}

export async function fetchSubscriptionSummary() {
  return toJson(await authFetch(`${BASE}/me`))
}

export async function purchaseSubscription(type) {
  return toJson(await authFetch(`${BASE}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }))
}
