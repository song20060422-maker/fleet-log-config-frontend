<template>
  <div>
    <h2 class="page-title">留痕审计</h2>
    <p class="page-desc">越权、拒绝与关键动作全部留痕：谁、何时、什么操作、是否被受理以及原因。</p>
    <div class="card">
      <div class="row" style="margin-bottom: 12px;">
        <label class="field">条数
          <select v-model.number="limit" style="min-width: 100px;">
            <option :value="50">50</option><option :value="100">100</option><option :value="300">300</option>
          </select>
        </label>
        <button class="primary" @click="load">刷新</button>
        <button class="ghost" @click="exportState">导出业务状态 JSON</button>
      </div>
      <table>
        <thead><tr><th>时间</th><th>操作者</th><th>角色</th><th>动作</th><th>对象</th><th>结果</th><th>原因 / 详情</th></tr></thead>
        <tbody>
          <tr v-if="!events.length"><td colspan="7" class="muted">暂无留痕。</td></tr>
          <tr v-for="e in events" :key="e.id">
            <td class="mono">{{ fmtTime(e.at) }}</td>
            <td>{{ e.actor }}</td>
            <td>{{ ROLE_LABEL[e.role] || e.role }}</td>
            <td class="mono">{{ e.action }}</td>
            <td class="mono">{{ e.target || e.activity_id || e.vehicle_id || '-' }}</td>
            <td><span class="tag" :class="e.accepted ? 'ok' : 'bad'">{{ e.accepted ? '受理' : '拒绝' }}</span></td>
            <td>{{ e.reason }}<div class="muted mono" v-if="e.detail">{{ e.detail }}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api, errText } from '../api'
import { ROLE_LABEL } from '../store'
import { fmtTime } from '../helpers'

const events = ref([])
const limit = ref(100)

async function load() {
  try {
    events.value = await api.get(`/api/audit/events?limit=${limit.value}`)
  } catch (e) { window.__flash('error', errText(e)) }
}
onMounted(load)

async function exportState() {
  try {
    const data = await api.get('/api/state/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fleet-state-export.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) { window.__flash('error', errText(e)) }
}
</script>
