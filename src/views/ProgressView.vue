<template>
  <div>
    <h2 class="page-title">③ 逐车进度核查</h2>
    <p class="page-desc">逐车展示发布前值、期望值、实际生效值、结果与失败原因；下发 ≠ 生效，全部信息可解释。</p>

    <div class="card">
      <label class="field">选择活动
        <select v-model="selected" style="min-width: 360px;">
          <option v-for="a in activities" :key="a.id" :value="a.id">{{ a.id }}（{{ label(ACT_STATUS, a.status) }}）</option>
        </select>
      </label>
    </div>

    <div class="card" v-if="p">
      <h3>活动 {{ p.activity.id }} · {{ label(ACT_STATUS, p.activity.status) }} · 申请 {{ p.application.id }}（{{ p.application.interval }} 秒）</h3>
      <div class="kv">
        <span class="k">已发布车辆</span><span class="mono">{{ p.published_vehicle_ids?.join('、') || '无' }}</span>
        <span class="k">未发布车辆</span><span class="mono">{{ p.unpublished_vehicle_ids?.join('、') || '无' }}</span>
        <span class="k">成功车辆</span><span>{{ p.success_count }} / {{ p.vehicles?.length }}</span>
        <span class="k">超时判定</span><span>发布 {{ p.timeout_seconds }} 秒内未获有效回执即显示超时</span>
      </div>
      <div class="banner warn" v-if="p.promote_block_reason" style="margin-top: 8px;">推广：{{ p.promote_block_reason }}</div>
      <div class="banner warn" v-if="p.complete_block_reason">完成：{{ p.complete_block_reason }}</div>
      <div class="banner ok" v-if="p.all_recovered_shown">全部需恢复车辆均已确认恢复（可展示「全部恢复」）</div>
    </div>

    <div class="card" v-if="p">
      <h3>逐车核查</h3>
      <table>
        <thead>
          <tr>
            <th>车辆</th><th>阶段</th><th>发布前值</th><th>期望值</th><th>生效值</th><th>生效版本</th><th>结果</th><th>失败原因 / 未确认说明</th><th>超时历史</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in p.vehicles" :key="v.vehicle_id">
            <td><b>{{ v.vehicle_id }}</b></td>
            <td>{{ KIND[v.phase] || v.phase }}</td>
            <td>{{ v.base_value }} 秒</td>
            <td>{{ v.expected_value }} 秒 <span class="muted mono">v{{ v.expected_version }}</span></td>
            <td>
              <template v-if="v.effective_version > 0">{{ v.effective_value }} 秒 <span class="muted mono">v{{ v.effective_version }}</span></template>
              <template v-else><span class="muted">保持 {{ v.effective_value }} 秒（无成功回执）</span></template>
            </td>
            <td class="mono">{{ v.effective_version || '-' }}</td>
            <td><span class="tag" :class="tag(RESULT, v.result)">{{ label(RESULT, v.result) }}</span></td>
            <td>
              <div v-if="v.fail_reason">{{ v.fail_reason }}</div>
              <div class="muted" v-else-if="v.result === 'unconfirmed'">等待车辆回执确认（未确认项不得显示「全部恢复」）</div>
              <div class="muted" v-else-if="v.result === 'published'">已下发，等待车辆拉取并回执</div>
              <div class="muted" v-else-if="v.result === 'not_published'">未被下发过配置</div>
              <div class="muted mono" v-if="v.acked_at">回执时间：{{ fmtTime(v.acked_at) }}</div>
            </td>
            <td>
              <template v-if="v.timeout_history?.length">
                <div class="mono" v-for="(t, i) in v.timeout_history" :key="i">
                  v{{ t.version }} @ {{ fmtTime(t.at) }} <span class="tag" :class="t.resolved_by_late_success ? 'ok' : 'warn'">{{ t.resolved_by_late_success ? '迟到成功已翻转' : '仍未回执' }}</span>
                </div>
              </template>
              <span class="muted" v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card" v-else><span class="muted">暂无活动数据。</span></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'
import { ACT_STATUS, RESULT, KIND, mapLabel, mapTag, fmtTime } from '../helpers'

const route = useRoute()
const activities = ref([])
const selected = ref('')
const p = ref(null)

const label = (m, k) => mapLabel(m, k)
const tag = (m, k) => mapTag(m, k)

async function loadList() {
  activities.value = await api.get('/api/activities')
  if (!selected.value && activities.value.length) {
    selected.value = route.query.activity || activities.value[0].id
  }
}
async function loadDetail() {
  if (!selected.value) { p.value = null; return }
  p.value = await api.get(`/api/activities/${selected.value}/progress`)
}
onMounted(async () => { await loadList(); await loadDetail() })
watch(selected, loadDetail)
</script>
