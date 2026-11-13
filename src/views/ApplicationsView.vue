<template>
  <div>
    <h2 class="page-title">① 申请与审批</h2>
    <p class="page-desc">申请必须包含排查原因、五台目标车辆与 10~300 秒的新间隔；审批人不能是申请人；批准后参数冻结，退回后可修改再提交。</p>

    <div class="card" v-if="canCreate">
      <h3>新建申请（研发申请人）</h3>
      <div class="row">
        <label class="field" style="flex: 2;">排查原因<textarea v-model="form.reason" placeholder="例如：排查车机诊断日志偶发缺失"></textarea></label>
        <label class="field">日志间隔（秒）<input v-model.number="form.interval" type="number" min="10" max="300" /></label>
        <label class="field">目标车辆
          <select v-model="form.fleetPreset" disabled style="min-width: 240px;">
            <option value="all">FLEET-01 全部五台（VEH-01 ~ VEH-05）</option>
          </select>
        </label>
        <button class="primary" @click="create" :disabled="busy">提交申请</button>
      </div>
    </div>
    <div class="banner info" v-else>当前账号（{{ session.user?.name }}）无创建申请权限；切换研发申请人账号可演示申请。</div>

    <div class="card">
      <h3>申请列表</h3>
      <table>
        <thead>
          <tr><th>申请编号</th><th>原因</th><th>间隔</th><th>目标车辆</th><th>申请人</th><th>审批人</th><th>状态</th><th style="width: 340px;">操作</th></tr>
        </thead>
        <tbody>
          <tr v-if="!apps.length"><td colspan="8" class="muted">暂无申请，请先创建。</td></tr>
          <tr v-for="a in apps" :key="a.id">
            <td class="mono">{{ a.id }}</td>
            <td style="max-width: 220px;">
              {{ a.reason }}
              <div class="muted" v-if="a.reject_reason">退回原因：{{ a.reject_reason }}</div>
            </td>
            <td>{{ a.interval }} 秒</td>
            <td class="muted">{{ a.vehicle_ids?.length }} 台</td>
            <td>{{ a.applicant }}</td>
            <td>{{ a.approver || '-' }}</td>
            <td><span class="tag" :class="tag(APP_STATUS, a.status)">{{ label(APP_STATUS, a.status) }}</span></td>
            <td>
              <template v-if="a.status === 'pending'">
                <button class="ok" v-if="canApprove && session.user?.username !== a.applicant" @click="approve(a)">批准</button>
                <button class="bad" v-if="canApprove && session.user?.username !== a.applicant" @click="reject(a)">退回</button>
                <span class="tag muted" v-if="session.user?.username === a.applicant">申请人不能自审批</span>
              </template>
              <template v-if="a.status === 'rejected' && canCreate && session.user?.username === a.applicant">
                <button class="primary" @click="startRevise(a)">修改后重新提交</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" v-if="editing">
      <h3>修改申请 {{ editing.id }}（退回后修改再提交）</h3>
      <div class="row">
        <label class="field" style="flex: 2;">排查原因<textarea v-model="editForm.reason"></textarea></label>
        <label class="field">日志间隔（秒）<input v-model.number="editForm.interval" type="number" /></label>
        <button class="primary" @click="submitRevise" :disabled="busy">重新提交</button>
        <button class="ghost" @click="editing = null">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, errText } from '../api'
import { can, session } from '../store'
import { APP_STATUS, mapLabel, mapTag } from '../helpers'

const apps = ref([])
const busy = ref(false)
const editing = ref(null)
const editForm = ref({ reason: '', interval: 30 })
const form = ref({ reason: '', interval: 30, fleetPreset: 'all' })

const canCreate = computed(() => can('createApplication'))
const canApprove = computed(() => can('approve'))

async function load() {
  apps.value = await api.get('/api/applications')
}
onMounted(load)

async function create() {
  busy.value = true
  try {
    await api.post('/api/applications', {
      reason: form.value.reason,
      vehicle_ids: session.meta?.preset_vehicle_ids || ['VEH-01', 'VEH-02', 'VEH-03', 'VEH-04', 'VEH-05'],
      interval: form.value.interval
    })
    form.value.reason = ''
    window.__flash('ok', '申请已创建，等待审批负责人审批')
    await load()
  } catch (e) { window.__flash('error', errText(e)) } finally { busy.value = false }
}

async function approve(a) {
  try {
    await api.post(`/api/applications/${a.id}/approve`)
    window.__flash('ok', `${a.id} 已批准，参数已冻结`)
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

async function reject(a) {
  const reason = window.prompt('请输入退回原因（必填）：')
  if (reason === null) return
  try {
    await api.post(`/api/applications/${a.id}/reject`, { reason })
    window.__flash('warn', `${a.id} 已退回`)
    await load()
  } catch (e) { window.__flash('error', errText(e)) }
}

function startRevise(a) {
  editing.value = a
  editForm.value = { reason: a.reason, interval: a.interval }
}

async function submitRevise() {
  busy.value = true
  try {
    await api.put(`/api/applications/${editing.value.id}`, {
      reason: editForm.value.reason,
      vehicle_ids: ['VEH-01', 'VEH-02', 'VEH-03', 'VEH-04', 'VEH-05'],
      interval: editForm.value.interval
    })
    editing.value = null
    window.__flash('ok', '申请已修改并重新提交审批')
    await load()
  } catch (e) { window.__flash('error', errText(e)) } finally { busy.value = false }
}

const label = (m, k) => mapLabel(m, k)
const tag = (m, k) => mapTag(m, k)
</script>
