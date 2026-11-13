// 统一 API 封装：token 鉴权、错误码透出、业务状态导出
const TOKEN_KEY = 'fleet_token'

export function getToken() { return localStorage.getItem(TOKEN_KEY) || '' }
export function setToken(t) { localStorage.setItem(TOKEN_KEY, t) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  let data = null
  const text = await res.text()
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (res.status === 401) {
    clearToken()
    if (!path.startsWith('/api/auth/login')) {
      throw new ApiError(401, 'UNAUTHORIZED', data?.message || '登录已失效，请重新登录')
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, String(data?.code ?? ''), data?.message || `请求失败（HTTP ${res.status}）`)
  }
  return data?.data !== undefined ? data.data : data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
}

export function errText(e) {
  if (e instanceof ApiError) return e.code ? `[${e.code}] ${e.message}` : e.message
  return e?.message || String(e)
}
