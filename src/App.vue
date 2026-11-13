<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">车队诊断日志配置<br />发布与恢复</div>
      <div class="sub">FLEET-01 · 五台测试车辆 · 间隔 10~300 秒</div>
      <router-link class="nav-item" to="/applications">① 申请与审批</router-link>
      <router-link class="nav-item" to="/activities">② 试点与推广</router-link>
      <router-link class="nav-item" to="/progress">③ 逐车进度核查</router-link>
      <router-link class="nav-item" to="/restore">④ 恢复与结果</router-link>
      <router-link class="nav-item" to="/vehicle">⑤ 模拟车辆</router-link>
      <router-link class="nav-item" to="/audit">留痕审计</router-link>
      <div class="whoami" v-if="session.user">
        <b>{{ session.user.name }}</b>
        {{ ROLE_LABEL[session.user.role] }}（{{ session.user.username }}）
        <button class="ghost" @click="doLogout">退出登录</button>
      </div>
      <div class="whoami" v-else>
        <b>未登录</b>
        <router-link class="nav-item" to="/login">前往登录</router-link>
      </div>
    </aside>
    <main class="main">
      <div class="banner error" v-if="flash.error">{{ flash.error }}</div>
      <div class="banner ok" v-if="flash.ok">{{ flash.ok }}</div>
      <div class="banner warn" v-if="flash.warn">{{ flash.warn }}</div>
      <div v-if="!session.loaded" class="loading">正在连接后端服务…（请确认 fleet 服务已启动在 :8000）</div>
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { session, logout, ROLE_LABEL } from './store'

const flash = reactive({ error: '', ok: '', warn: '' })
const router = useRouter()

window.__flash = (type, msg) => {
  flash[type] = msg
  setTimeout(() => { flash[type] = '' }, 5000)
}

function doLogout() {
  logout()
  router.push('/login')
}
</script>
