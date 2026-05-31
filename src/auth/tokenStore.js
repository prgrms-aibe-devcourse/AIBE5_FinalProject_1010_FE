/**
 * @file tokenStore.js
 * @description access token을 브라우저 메모리에만 저장하는 단순 스토어입니다.
 * - 새로고침/탭 종료 시 값이 사라집니다.
 * - refresh token은 서버가 httponly 쿠키로 관리합니다.
 */

const accessTokenStore = {
  token: null,
  expiry: null,
  tokenLoading: true
}

const tokenLoadingWaiters = []

export function getAccessToken() {
  return accessTokenStore.token
}

export function getAccessTokenExpiry() {
  return accessTokenStore.expiry
}

export function getIsTokenLoading() {
  return accessTokenStore.tokenLoading
}

export function hasAccessToken() {
  return !!accessTokenStore.token
}

export function setAccessToken(token, expiresIn) {
  accessTokenStore.token = token || null
  accessTokenStore.expiry = expiresIn ? (Date.now() + Number(expiresIn)) : null

  // 전역 UI(예: Navbar)가 로그인 상태 변화를 감지하도록 이벤트 브로드캐스트
  try {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: {
          token: accessTokenStore.token,
          expiry: accessTokenStore.expiry,
          tokenLoading: accessTokenStore.tokenLoading
        }
      })
    )
  } catch (err) {
    console.warn('accessTokenChanged 이벤트 발송 실패', err)
  }
}

export function setTokenLoading(isLoading) {
  accessTokenStore.tokenLoading = !!isLoading

  if (!accessTokenStore.tokenLoading) {
    // 대기 중인 API 요청들을 풀어줍니다.
    while (tokenLoadingWaiters.length) {
      const resolve = tokenLoadingWaiters.shift()
      resolve()
    }
  }

  try {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: {
          token: accessTokenStore.token,
          expiry: accessTokenStore.expiry,
          tokenLoading: accessTokenStore.tokenLoading
        }
      })
    )
  } catch (err) {
    console.warn('accessTokenChanged 이벤트 발송 실패', err)
  }
}

export function waitForTokenLoadingToFinish() {
  if (!accessTokenStore.tokenLoading) return Promise.resolve()
  return new Promise((resolve) => {
    tokenLoadingWaiters.push(resolve)
  })
}

export function clearAccessToken() {
  setAccessToken(null)
}

