import { reactive } from 'vue'
import { api, getToken, setToken, clearToken } from './api'

// 全局会话与演示元信息
export const session = reactive({
  user: null,
  meta: null,
  loaded: false,
  error: ''
})

export const ROLE_LABEL = {
  applicant: '研发申请人',
  approver: '审批负责人',
  operator: '发布运营',
  vehicle: '模拟车辆'
}

export async function bootstrap() {
  session.error = ''
  try {
    session.meta = await api.get('/api/meta')
    if (getToken()) {
      session.user = await api.get('/api/me')
    }
  } catch (e) {
    if (e?.status !== 401) session.error = e?.message || String(e)
  } finally {
    session.loaded = true
  }
}

export async function login(username, password) {
  const data = await api.post('/api/auth/login', { username, password })
  setToken(data.token)
  session.user = data.user
  return data.user
}

export function logout() {
  clearToken()
  session.user = null
}

export function can(action, user = session.user) {
  if (!user) return false
  const r = user.role
  switch (action) {
    case 'createApplication': case 'reviseApplication': return r === 'applicant'
    case 'approve': case 'reject': case 'approveRestore': case 'complete': case 'completeRestore': case 'stop': return r === 'approver'
    case 'createActivity': case 'promote': case 'retryPilot': case 'publishRestore': case 'export': case 'audit': return r === 'operator' || r === 'approver'
    case 'vehicle': return r === 'vehicle'
    default: return false
  }
}
