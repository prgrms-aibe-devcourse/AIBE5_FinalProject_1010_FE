/**
 * @file voiceConfig.js
 * @description 보이스톡 WebRTC ICE 서버 설정입니다.
 */

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

function normalizeIceServer(server) {
  if (typeof server === 'string' && server.trim()) {
    return { urls: server.trim() }
  }
  if (server && typeof server === 'object' && server.urls) {
    return server
  }
  return null
}

function parseIceServers(raw) {
  if (!raw) return DEFAULT_ICE_SERVERS

  try {
    const parsed = JSON.parse(raw)
    const servers = (Array.isArray(parsed) ? parsed : [parsed])
      .map(normalizeIceServer)
      .filter(Boolean)
    return servers.length > 0 ? servers : DEFAULT_ICE_SERVERS
  } catch {
    const servers = raw
      .split(',')
      .map(normalizeIceServer)
      .filter(Boolean)
    return servers.length > 0 ? servers : DEFAULT_ICE_SERVERS
  }
}

export const VOICE_ICE_SERVERS = parseIceServers(import.meta.env.VITE_VOICE_ICE_SERVERS)
