/**
 * @file OAuth2CallbackPage.jsx
 * @description 기존 소셜 회원 로그인 콜백 페이지 (HashRouter 라우트).
 * - BE가 /#/oauth2/callback?code={oneTimeCode} 로 리다이렉트한다.
 * - code를 POST /api/v1/auth/oauth2/token 으로 교환해 accessToken을 메모리에 저장하고 홈으로 이동.
 * - error 파라미터가 있으면 로그인 페이지로 돌려보낸다.
 */
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../auth/authApi.js'
import { setAuthData, setTokenLoading } from '../../auth/tokenStore.js'

export default function OAuth2CallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const error = params.get('error')
    const code = params.get('code')

    if (error || !code) {
      navigate('/login?error=social_failed', { replace: true })
      return
    }

    setTokenLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // refreshToken httpOnly 쿠키 수신
          cache: 'no-store',
          body: JSON.stringify({ code }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          if (data.accessToken) {
            setAuthData(data.accessToken, data.accessExpiresIn, {
              name: data.name,
              role: data.role,
              userId: data.userId,
            })
          }
          navigate('/', { replace: true })
        } else {
          navigate('/login?error=social_failed', { replace: true })
        }
      } catch {
        navigate('/login?error=social_failed', { replace: true })
      } finally {
        setTokenLoading(false)
      }
    })()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0f172a', fontWeight: 600 }}>
      로그인 처리 중…
    </div>
  )
}
