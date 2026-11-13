import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import { bootstrap } from './store'

import LoginView from './views/LoginView.vue'
import ApplicationsView from './views/ApplicationsView.vue'
import ActivitiesView from './views/ActivitiesView.vue'
import ProgressView from './views/ProgressView.vue'
import RestoreView from './views/RestoreView.vue'
import VehicleView from './views/VehicleView.vue'
import AuditView from './views/AuditView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/applications' },
    { path: '/login', component: LoginView },
    { path: '/applications', component: ApplicationsView },
    { path: '/activities', component: ActivitiesView },
    { path: '/progress', component: ProgressView },
    { path: '/restore', component: RestoreView },
    { path: '/vehicle', component: VehicleView },
    { path: '/audit', component: AuditView }
  ]
})

bootstrap()
createApp(App).use(router).mount('#app')
