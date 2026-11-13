# fleet-log-config-frontend

车队诊断日志配置发布与恢复 · 原型前端（Vue3 + Vite），配套后端仓库：[fleet-log-config](https://github.com/song20060422-maker/fleet-log-config)。

## 页面

| 路由 | 页面 | 对应原型要求 |
|------|------|--------------|
| `#/login` | 登录 | 预置账号（dev / approver / ops / vehicle-01~05）切换角色演示 |
| `#/applications` | 申请与审批 | 申请创建、退回修改再提交、批准/退回、参数冻结提示 |
| `#/activities` | 试点与推广 | 创建活动、试点下发、推广门禁、重试试点、停止活动、记为完成 |
| `#/progress` | 逐车进度核查 | 发布前值/期望值/生效值/结果/失败原因/超时历史逐车展示 |
| `#/restore` | 恢复与结果 | 批准恢复 → 更高版本下发 → 逐车确认 → 恢复完成与「全部恢复」门禁 |
| `#/vehicle` | 模拟车辆 | 拉取配置、成功/失败回执、本车期望值与生效值、拉取记录 |
| `#/audit` | 留痕审计 | 越权/拒绝/关键动作留痕查询与业务状态导出 |

## 本地运行

```bash
npm install
npm run dev   # http://localhost:5173，/api 代理到 http://127.0.0.1:8000
```

前置：后端 `fleet-log-config` 已启动（`go run .`，默认 :8000）。演示口令见后端 `GET /api/meta` 的 `demo_password`。
