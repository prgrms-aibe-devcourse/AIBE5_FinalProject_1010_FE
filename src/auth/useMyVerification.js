import { useState, useEffect } from 'react'
import { authFetch } from '../api/authFetch.js'
import { API_BASE } from '../api/config.js'
import { getRole } from './tokenStore.js'

export function useMyVerification() {
  const role = getRole()
  const [isVerified, setIsVerified] = useState(null)
  const [loading, setLoading] = useState(role === 'TEACHER')

  useEffect(() => {
    if (role !== 'TEACHER') { setLoading(false); return }
    let active = true
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active) setIsVerified(data?.isVerified === true) })
      .catch(() => { if (active) setIsVerified(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [role])

  return { role, isVerified, loading }
}
