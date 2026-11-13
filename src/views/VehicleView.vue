<template>
  <div>
    <h2 class="page-title">⑤ 模拟车辆</h2>
    <p class="page-desc">车辆凭认证身份拉取面向自己的最新配置并上报回执；重复成功不重复记账，旧版本、未知版本与跨车回执会被拒绝并留痕。</p>

    <div class="banner warn" v-if="session.user?.role !== 'vehicle'">
      当前账号不是车辆身份。请退出后使用 vehicle-01 ~ vehicle-05 登录（口令同演示口令）。
    </div>

    <div class="card" v-if="session.user?.role === 'vehicle'">
      <h3>车辆 {{ session.user.vehicle_id }} 操作台</h3>
      <div class="row">
        <button class="primary" @click="pull">拉取最新配置</button>
        <button class="ok" @click="receipt(true)">上报成功回执</button>
        <button class="bad" @click="receipt(false)">上报失败回执</button>
        <button class="ghost" @click="loadState">刷新本车状态</button>
        <button class="ghost" @click="switchVehicle">切换车辆账号</button>
      </div>
      <label class="field" style="margin-top: 10px;">回执说明（失败原因会随逐车核查展示）
        <input v-model="message" placeholder="例如：应用成功 / 存储空间不足 / 网络异常" style="min-width: 420px;" />
      </label>
    </div>

    <div class="card" v-if="state">
      <h3>本车状态（期望值 / 生效值 分开保存）</h3>
      <div class="kv">
        <span class="k">车辆</span><span class="mono">{{ state.vehicle_id }}（车队 {{ state.fleet_id || 'FLEET-01' }}）</span>
        <span class="k">期望值</span>
        <span>{{ state.desired_version > 0 ? `${state.desired_value} 秒（v${state.desired_version}，已下发）` : '尚无下发' }}</span>
        <span class="k">生效值</span>
        <span>{{ state.effective_version > 0 ? `${state.effective_value} 秒（v${state.effective_version}，来自成功回执）` : `${state.effective_value} 秒（活动前值，无成功回执）` }}</span>
        <span class="k">结果</span><span class="tag" :class="tag(RESULT, state.result)">{{ label(RESULT, state.result) }}</span>
        <span class="k">失败原因</span><span>{{ state.fail_reason || '-' }}</span>
      </div>
    </div>

    <div class="card" v-if="pulls.length">
      <h3>本车拉取记录</h3>
      <table>
        <thead><tr><th>时间</th><th>版本</th><th>结果</th><th>说明</th></tr></thead>
        <tbody>
          <tr v-for="(r, i) in pulls" :key="i">
            <td class="mono">{{ fmtTime(r.at) }}</td>
            <td class="mono">{{ r.version || '-' }}</td>
            <td><span class="tag" :class="r.granted ? 'ok' : 'bad'">{{ r.granted ? '已取得' : '被拒绝' }}</span></td>
            <td>{{ r.reject_reason || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errText } from '../api'
import { session } from '../store'
import { RESULT, mapLabel, mapTag, fmtTime } from '../helpers'

const router = useRouter()
const state = ref(null)
const message = ref('')
const pulls = ref([])

async function loadState() {
  try {
    const data = await api.get('/api/vehicle/state')
    state.value = data.state
    pulls.value = data.pulls || []
  } catch (e) { window.__flash('error', errText(e)) }
}
onMounted(async () => {
  if (session.user?.role === 'vehicle') await loadState()
})

async function pull() {
  try {
    const res = await api.get('/api/vehicle/config')
    if (res.granted) {
      window.__flash('ok', `已取得配置：v${res.version}，目标 ${res.interval} 秒（${res.kind === 'recover' ? '恢复' : res.kind === 'promote' ? '推广' : '试点'}批次）。请回执确认。`)
      await loadState()
    } else {
      window.__flash('warn', `拉取被拒绝：${res.reject_reason}`)
    }
  } catch (e) { window.__flash('error', errText(e)) }
}

async function receipt(success) {
  if (!state.value?.desired_version) {
    window.__flash('warn', '本车尚无已下发的期望版本，无可回执的配置')
    return
  }
  try {
    const res = await api.post('/api/vehicle/receipt', {
      version: state.value.desired_version,
      success,
      message: message.value
    })
    if (success) {
      window.__flash('ok', res.recorded
        ? `成功回执已记账：生效值更新为 ${res.effective_value} 秒（v${res.effective_version}）`
        : '重复成功回执：仅幂等留痕，不重复记账')
    } else {
      window.__flash('warn', `失败回执已受理：结果记为失败（生效值保持 ${res.effective_value} 秒 / v${res.effective_version}）`)
    }
    await loadState()
  } catch (e) { window.__flash('error', errText(e)) }
}

function switchVehicle() {
  const accounts = session.meta?.accounts?.filter(a => a.role === 'vehicle') || []
  const current = session.user?.username
  const idx = accounts.findIndex(a => a.username === current)
  const next = accounts[(idx + 1 + accounts.length) % accounts.length]
  router.push('/login')
  window.__flash('warn', `请使用 ${next.username} 登录以切换车辆`)
}
const label = (m, k) => mapLabel(m, k)
const tag = (m, k) => mapTag(m, k)
</script>
