import { authFetch } from './authFetch.js'
import { API_BASE } from './config.js'

export async function dropEnrollment(enrollmentId) {
  const res = await authFetch(`${API_BASE}/api/v1/enrollments/${enrollmentId}/drop`, { method: 'PATCH' })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || `수강 포기 실패 (${res.status})`)
  }
}
