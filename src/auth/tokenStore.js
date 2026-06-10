/**
 * @file tokenStore.js
 * @description access token을 브라우저 메모리에만 저장하는 단순 스토어입니다.
 * - 새로고침/탭 종료 시 값이 사라집니다.
 * - refresh token은 서버가 httponly 쿠키로 관리합니다.
 */

const accessTokenStore = {
  token: null,
  expiry: null,
  tokenLoading: true,
  // 서버 응답에서 받은 사용자 정보 (로그인/reissue 시 갱신)
  name: null,
  role: null,
  userId: null,
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

  // 토큰이 사라질 때(로그아웃/만료) 사용자 정보도 함께 초기화
  if (!accessTokenStore.token) {
    accessTokenStore.name   = null
    accessTokenStore.role   = null
    accessTokenStore.userId = null
  }

  // 전역 UI(예: Navbar)가 로그인 상태 변화를 감지하도록 이벤트 브로드캐스트
  try {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: {
          token: accessTokenStore.token,
          expiry: accessTokenStore.expiry,
          tokenLoading: accessTokenStore.tokenLoading,
          name: accessTokenStore.name,
          role: accessTokenStore.role,
          userId: accessTokenStore.userId,
        }
      })
    )
  } catch (err) {
    console.warn('accessTokenChanged 이벤트 발송 실패', err)
  }
}

/**
 * 토큰과 사용자 정보를 한 번에 저장하고 이벤트를 1회만 브로드캐스트합니다.
 * setAccessToken + setUserInfo를 따로 호출할 때 이벤트가 2번 발생해 Navbar가 깜빡이는 문제를 해결합니다.
 */
export function setAuthData(token, expiresIn, { name = null, role = null, userId = null } = {}) {
  accessTokenStore.token  = token || null
  accessTokenStore.expiry = expiresIn ? (Date.now() + Number(expiresIn)) : null

  if (!accessTokenStore.token) {
    accessTokenStore.name   = null
    accessTokenStore.role   = null
    accessTokenStore.userId = null
  } else {
    accessTokenStore.name   = name   ?? accessTokenStore.name
    accessTokenStore.role   = role   ?? accessTokenStore.role
    accessTokenStore.userId = userId ?? accessTokenStore.userId
  }

  try {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: {
          token: accessTokenStore.token,
          expiry: accessTokenStore.expiry,
          tokenLoading: accessTokenStore.tokenLoading,
          name: accessTokenStore.name,
          role: accessTokenStore.role,
          userId: accessTokenStore.userId,
        }
      })
    )
  } catch (err) {
    console.warn('accessTokenChanged 이벤트 발송 실패', err)
  }
}

/**
 * 서버 응답에서 받은 사용자 정보(name, role, userId)를 저장하고 이벤트를 브로드캐스트합니다.
 * @deprecated setAuthData(token, expiresIn, userInfo)로 대체하세요.
 */
export function setUserInfo({ name = null, role = null, userId = null } = {}) {
  accessTokenStore.name   = name   ?? accessTokenStore.name
  accessTokenStore.role   = role   ?? accessTokenStore.role
  accessTokenStore.userId = userId ?? accessTokenStore.userId

  try {
    window.dispatchEvent(
      new CustomEvent('accessTokenChanged', {
        detail: {
          token: accessTokenStore.token,
          expiry: accessTokenStore.expiry,
          tokenLoading: accessTokenStore.tokenLoading,
          name: accessTokenStore.name,
          role: accessTokenStore.role,
          userId: accessTokenStore.userId,
        }
      })
    )
  } catch (err) {
    console.warn('accessTokenChanged 이벤트 발송 실패', err)
  }
}

/** 저장된 사용자 이름을 반환합니다. */
export function getUserName() {
  return accessTokenStore.name
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
          tokenLoading: accessTokenStore.tokenLoading,
          name: accessTokenStore.name,
          role: accessTokenStore.role,
          userId: accessTokenStore.userId,
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

function decodePayload() {
  const token = accessTokenStore.token
  if (!token) return null
  try {
    const raw = token.split('.')[1]
    if (!raw) return null
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - raw.length % 4) % 4)
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/**
 * 저장된 access token의 role claim을 디코딩해 반환합니다.
 * - 진입 UX 개선 목적 (서버 검증 대체 불가 — 서버는 항상 역할을 재확인함)
 */
export function getRole() {
  return decodePayload()?.role ?? null
}

/**
 * 저장된 access token의 sub claim(사용자 ID)을 숫자로 반환합니다.
 * - 진입 UX 개선 목적 (서버 검증 대체 불가)
 */
export function getCurrentUserId() {
  const sub = decodePayload()?.sub
  return sub ? Number(sub) : null
}

