/** 응답을 JSON으로 파싱하고, 실패 시 message를 담은 Error를 던집니다. */
export async function toJson(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || `요청 실패 (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}
