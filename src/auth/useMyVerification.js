/**
 * @file useMyVerification.js
 * @description 현재 로그인한 선생님의 관리자 인증(isVerified) 여부를 조회하는 훅.
 * - JWT에는 role만 있고 isVerified는 없으므로 GET /api/v1/users/me로 조회한다.
 * - 선생님이 아니면 인증 개념이 없으므로 막지 않는다(isVerified=null).
 * - 미인증 선생님의 전용 기능 버튼을 비활성화하는 UX 용도이며, 실제 차단은 백엔드가 한다.
 *
 * @returns {{ role: string|null, isVerified: boolean|null, loading: boolean }}
 *   isVerified: 선생님이며 인증 완료=true / 미인증=false / 비선생님·판단 전=null
 */
import { useState, useEffect } from 'react'
import { authFetch } from '../api/authFetch.js'
import { API_BASE } from '../api/config.js'
import { getRole } from './tokenStore.js'

export function useMyVerification() {
  const role = getRole()
  const [isVerified, setIsVerified] = useState(null)
  const [loading, setLoading] = useState(role === 'TEACHER')

  useEffect(() => {
    if (role !== 'TEACHER') {
      setLoading(false)
      return
    }
    let active = true
    authFetch(`${API_BASE}/api/v1/users/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active) setIsVerified(data?.isVerified === true) })
      .catch(() => { if (active) setIsVerified(false) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [role])

  return { role, isVerified, loading }
}
