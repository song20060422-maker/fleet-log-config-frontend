<template>
  <div>
    <h2 class="page-title">④ 恢复与结果核查</h2>
    <p class="page-desc">停止活动不撤销车端配置；恢复原设置需要新一轮更高版本的下发与逐车确认；所有需恢复车辆确认后才能记为恢复完成并展示「全部恢复」。</p>

    <div class="card" v-for="a in restoreActivities" :key="a.id">
      <h3>
        活动 {{ a.id }}
        <span class="tag" :class="tag(ACT_STATUS, a.status)" style="margin-left: 8px;">{{ label(ACT_STATUS, a.status) }}</span>
      </h3>
      <div class="kv" v-if="p(a.id)">
        <span class="k">需恢复车辆</span>
        <span class="mono">{{ p(a.id).needs_recovery_vehicle_ids?.join('、') || '无（无已下发车辆）' }}</span>
        <span class="k">恢复进度</span>
        <span>{{ p(a.id).restored_count }} / {{ p(a.id).needs_recovery_count }} 已确认</span>
        <span class="k">停止时间</span><span>{{ fmtTime(a.stopped_at) }}<template v-if="a.stop_reason">（{{ a.stop_reason }}）</template></span>
      </div>
      <div class="banner warn status-line" v-if="p(a.id)?.restore_block_reason">{{ p(a.id).restore_block_reason }}</div>
      <div class="banner error status-line" v-if="p(a.id)?.unconfirmed_restore_ids?.length && a.status === 'recovering'">
        未确认恢复：{{ p(a.id).unconfirmed_restore_ids.join('、') }} —— 仍有未确认项，禁止显示「全部恢复」，也不可记为恢复完成
      </div>
      <div class="banner ok status-line" v-if="a.status === 'recovered'">全部需恢复车辆均已确认恢复，本活动已记为「恢复完成」。</div>
      <div class="row" style="margin-top: 10px;">
        <button class="ok" v-if="canApprove && a.status === 'stopped' && !p(a.id)?.restore_approved" @click="approve(a)">批准恢复（审批负责人）</button>
        <button class="primary" v-if="canPublish && a.status === 'stopped' && p(a.id)?.restore_approved" @click="publish(a)">下发恢复版本（更高版本 · 目标活动前值）</button>
        <button class="ok" v-if="canApprove && a.status === 'recovering'" @click="completeRestore(a)">记为恢复完成</button>
        <button class="ghost" @click="goDetail(a)">查看逐车进度</button>
      </div>
    </div>

    <div class="card" v-if="!restoreActivities.length">
      <span class="muted">暂无已停止/恢复中的活动。可在「试点与推广」停止一个活动后，在此发起恢复。</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errText } from '../api'
import { can, session } from '../store'
import { ACT_STATUS, mapLabel, mapTag, fmtTime } from '../helpers'

const router = useRouter()
const activities = ref([])
const progressMap = ref({})

const canApprove = computed(() => can('approve'))
const canPublish = computed(() => can('publishRestore'))

const restoreActivities = computed(() =>
  activities.value.filter(a => ['stopped', 'recovering', 'recovered'].includes(a.status)))

function p(id) { return progressMap.value[id] }

async function load() {
  activities.value = await api.get('/api/activities')
  for (const a of activities.value) {
    if (['stopped', 'recovering', 'recovered'].includes(a.status)) {
      progressMap.value[a.id] = await api.get(`/api/activities/${a.id}/progress`)
    }
  }
}
onMounted(load)

async function approve(a) {
  try {
    await api.post(`/api/activities/${a.id}/restore/approve`)
    window.__flash('ok', '已批准恢复，等待运营下发恢复版本')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function publish(a) {
  try {
    const act = await api.post(`/api/activities/${a.id}/restore/publish`)
    window.__flash('ok', `恢复版本已下发（活动 ${act.id}）：目标为各车活动前值，车辆确认后才算恢复`)
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function completeRestore(a) {
  try {
    await api.post(`/api/activities/${a.id}/restore/complete`)
    window.__flash('ok', '全部需恢复车辆已确认，活动记为「恢复完成」')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

function goDetail(a) { router.push({ path: '/progress', query: { activity: a.id } }) }
const label = (m, k) => mapLabel(m, k)
const tag = (m, k) => mapTag(m, k)
</script>
