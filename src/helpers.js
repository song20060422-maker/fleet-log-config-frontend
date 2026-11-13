// 状态中文映射与标签类型
export const APP_STATUS = {
  pending: ['待审批', 'warn'],
  approved: ['已批准', 'ok'],
  rejected: ['已退回', 'bad']
}

export const ACT_STATUS = {
  piloting: ['试点中', 'info'],
  promotion_ready: ['待推广', 'warn'],
  promoting: ['推广中', 'info'],
  paused: ['已暂停', 'warn'],
  stopped: ['已停止', 'bad'],
  recovering: ['恢复中', 'warn'],
  recovered: ['恢复完成', 'ok'],
  completed: ['已完成', 'ok']
}

export const RESULT = {
  not_published: ['未下发', 'muted'],
  published: ['已下发·待回执', 'info'],
  success: ['成功', 'ok'],
  failure: ['失败', 'bad'],
  timeout: ['超时', 'warn'],
  unconfirmed: ['待确认', 'warn']
}

export const KIND = { pilot: '试点', promote: '推广', recover: '恢复' }

export function mapLabel(map, key) {
  const item = map[key]
  return item ? item[0] : key
}
export function mapTag(map, key) {
  const item = map[key]
  return item ? item[1] : 'muted'
}

export function fmtTime(iso) {
  if (!iso) return '-'
  return String(iso).replace('T', ' ').replace('Z', '').slice(0, 19)
}
