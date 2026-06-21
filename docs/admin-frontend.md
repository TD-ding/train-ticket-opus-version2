# 管理后台文档

管理后台为原生 HTML/CSS/JavaScript 单页应用，由后端静态托管在 `/admin`。

## 访问

- 地址：`http://localhost:3000/admin/`
- 默认账号：`admin` / `admin123`（可通过环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 修改）
- 仅角色为 `admin` 的账号可登录，普通用户登录会被拒绝。

## 文件结构

| 文件 | 职责 |
|------|------|
| `admin/index.html` | 登录视图 + 管理主视图（统计、车次、订单） |
| `admin/css/admin.css` | 后台样式 |
| `admin/js/admin.js` | 全部交互逻辑：登录、统计、车次增删改、订单总览 |

## 功能区

### 运营数据概览
登录后顶部展示统计卡片：车次总数、订单总数、售出票数、营收。数据来自 `GET /api/admin/stats`，在切换视图与车次变更后刷新。

### 车次管理
- 表格列出全部车次。
- 「+ 新增车次」打开弹窗，填写车次号、起止站、日期、时刻、各座位「价格/数量」。
- 「编辑」复用弹窗，保存时通过 `GET /api/trains/:id` 取回原数据以保留各座位已售数。
- 「删除」二次确认后调用 `DELETE /api/admin/trains/:id`。

### 订单总览
表格展示全部订单：订单号、车次、行程、座位、乘客、金额、状态、下单时间（倒序）。

## 数据流

1. 登录 → `POST /api/auth/login` → 校验 `role === "admin"` → 保存 token。
2. 进入主视图 → `loadStats()` + `loadTrains()`。
3. 新增/编辑车次 → `parseSeat()` 解析「价格/数量」→ `POST` 或 `PUT /api/admin/trains` → 刷新。
4. 切换到订单视图 → `GET /api/admin/orders`。

## 关键事件

| 元素 | 事件 | 处理 |
|------|------|------|
| `#adminLoginBtn` | click | 管理员登录 |
| `#addTrainBtn` | click | 打开新增车次弹窗 |
| `#trainForm` | submit | 保存车次 |
| `.atab` | click | 切换车次/订单视图 |
| `#logoutBtn` | click | 刷新页面退出 |

## 安全

- token 仅存于内存变量（页面刷新即登出），降低 XSS 风险。
- 所有管理请求附带 `Authorization: Bearer <token>`，后端 `adminOnly` 二次校验角色。
- 座位类型、座位数与已售数的合法性由后端最终把关。
