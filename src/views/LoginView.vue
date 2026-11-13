<template>
  <div class="card" style="max-width: 620px;">
    <h3 class="page-title">登录</h3>
    <p class="page-desc">预置账号：dev（研发申请人）/ approver（审批负责人）/ ops（发布运营）/ vehicle-01~05（模拟车辆），初始口令见下方提示。</p>
    <div class="banner error" v-if="error">{{ error }}</div>
    <form @submit.prevent="submit" class="row" style="margin-top: 10px;">
      <label class="field">账号
        <select v-model="username">
          <option v-for="a in accounts" :key="a.username" :value="a.username">
            {{ a.username }}（{{ a.name }}）
          </option>
        </select>
      </label>
      <label class="field">口令
        <input v-model="password" type="password" placeholder="初始口令" required />
      </label>
      <button class="primary" type="submit" :disabled="busy">登录</button>
    </form>
    <p class="muted" style="margin-top: 12px;">车辆账号登录后进入「模拟车辆」页面拉取配置并回执；Web 端不做真实车载协议。</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, session } from '../store'
import { errText } from '../api'

const router = useRouter()
const accounts = computed(() => session.meta?.accounts || [])
const username = ref('dev')
const password = ref('')
const error = ref('')
const busy = ref(false)

watch(() => session.meta, (m) => { if (m && !password.value) password.value = m.demo_password || '' }, { immediate: true })

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await login(username.value, password.value || session.meta?.demo_password || '')
    router.push(session.user?.role === 'vehicle' ? '/vehicle' : '/applications')
  } catch (e) {
    error.value = errText(e)
  } finally {
    busy.value = false
  }
}
</script>
