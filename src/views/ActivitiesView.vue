<template>
  <div>
    <h2 class="page-title">② 试点与推广</h2>
    <p class="page-desc">同一车队同时只允许一个未结束活动；先选择两台试点，其余车辆不得提前取得配置；两台试点均成功后由运营确认推广，失败或超时则暂停。</p>

    <div class="card" v-if="canPublish">
      <h3>创建发布活动（发布运营）</h3>
      <div class="row" v-if="approvedApps.length">
        <label class="field">已批准申请
          <select v-model="selectedApp">
            <option v-for="a in approvedApps" :key="a.id" :value="a.id">
              {{ a.id }}（{{ a.interval }} 秒 · {{ a.reason }}）
            </option>
          </select>
        </label>
        <span class="muted" style="align-self: center;">试点车辆（固定两台）：</span>
        <label class="field" v-for="(p, i) in pilots" :key="i">
          <select v-model="pilots[i]" style="min-width: 110px;">
            <option v-for="v in vehicleIds" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>
        <button class="primary" @click="createActivity" :disabled="busy">创建并下发试点</button>
      </div>
      <div class="banner info" v-else>暂无已批准的申请；请先在「申请与审批」完成审批。</div>
    </div>

    <div class="card" v-for="a in activities" :key="a.id">
      <h3>
        活动 {{ a.id }}
        <span class="tag" :class="tag(ACT_STATUS, a.status)" style="margin-left: 8px;">{{ label(ACT_STATUS, a.status) }}</span>
        <span class="tag muted" style="margin-left: 6px;">目标 {{ a.interval }} 秒</span>
      </h3>
      <div class="kv">
        <span class="k">申请</span><span class="mono">{{ a.application_id }}</span>
        <span class="k">试点车辆</span><span class="mono">{{ a.pilot_vehicle_ids?.join('、') }}</span>
        <span class="k">目标车辆</span><span class="mono">{{ a.target_vehicle_ids?.join('、') }}</span>
        <span class="k">停止时间</span><span>{{ fmtTime(a.stopped_at) }}<template v-if="a.stop_reason">（{{ a.stop_reason }}）</template></span>
      </div>
      <div class="banner warn status-line" v-if="progressOf(a.id)?.promote_block_reason">
        {{ progressOf(a.id).promote_block_reason }}
      </div>
      <div class="row" style="margin-top: 10px;">
        <button class="ok" v-if="canPublish && canPromote(a.id)" @click="promote(a)">确认推广至剩余三台</button>
        <button class="warn" v-if="canPublish" @click="retryPilot(a)">重试试点</button>
        <button class="bad" v-if="canStop" @click="stop(a)">停止活动（仅停止未发送部分）</button>
        <button class="ok" v-if="canStop && canComplete(a.id)" @click="complete(a)">记为完成</button>
        <button class="ghost" @click="goDetail(a)">查看逐车进度</button>
      </div>
    </div>
    <div class="card" v-if="!activities.length"><span class="muted">暂无活动。创建活动后，试点车辆即可在「模拟车辆」拉取配置。</span></div>
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
const approvedApps = ref([])
const selectedApp = ref('')
const vehicleIds = computed(() => session.meta?.preset_vehicle_ids || [])
const pilots = ref(['VEH-01', 'VEH-02'])
const busy = ref(false)

const canPublish = computed(() => can('createActivity'))
const canStop = computed(() => can('stop'))

async function load() {
  activities.value = await api.get('/api/activities')
  approvedApps.value = (await api.get('/api/applications')).filter(a => a.status === 'approved')
  if (!selectedApp.value && approvedApps.value.length) selectedApp.value = approvedApps.value[0].id
  for (const a of activities.value) {
    progressMap.value[a.id] = await api.get(`/api/activities/${a.id}/progress`)
  }
}
onMounted(load)

function progressOf(id) { return progressMap.value[id] }
function canPromote(id) { return progressOf(id)?.can_promote }
function canComplete(id) { return progressOf(id)?.can_complete }

async function createActivity() {
  busy.value = true
  try {
    const act = await api.post('/api/activities', {
      application_id: selectedApp.value,
      pilot_vehicle_ids: pilots.value
    })
    window.__flash('ok', `活动 ${act.id} 已创建，试点配置已下发（只写期望值，等待车辆回执）`)
    await load()
  } catch (e) { window.__flash('error', errText(e)) } finally { busy.value = false }
}

async function promote(a) {
  try {
    await api.post(`/api/activities/${a.id}/promote`)
    window.__flash('ok', '已确认推广，剩余三台车辆可拉取新配置')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function retryPilot(a) {
  try {
    await api.post(`/api/activities/${a.id}/retry-pilot`)
    window.__flash('warn', '试点已重试下发，请车辆重新拉取并回执')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function stop(a) {
  const reason = window.prompt('请输入停止原因（必填）：')
  if (reason === null) return
  try {
    await api.post(`/api/activities/${a.id}/stop`, { reason })
    window.__flash('warn', '活动已停止：未发送部分不再下发；已发布与生效记录保留，可在「恢复与结果」发起恢复')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function complete(a) {
  try {
    await api.post(`/api/activities/${a.id}/complete`)
    window.__flash('ok', '活动已记为完成（全部目标车辆确认成功）')
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

function goDetail(a) { router.push({ path: '/progress', query: { activity: a.id } }) }
const label = (m, k) => mapLabel(m, k)
const tag = (m, k) => mapTag(m, k)
</script>
