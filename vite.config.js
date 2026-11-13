import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 开发态代理到本地 GoFrame 服务；生产构建产物可由任意静态服务器托管
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true }
    }
  }
})
