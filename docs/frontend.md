# 用户前端文档

用户前端为原生 HTML/CSS/JavaScript 实现，由后端通过静态托管在根路径 `/` 提供。

## 页面列表

| 页面 | 文件 | 说明 |
|------|------|------|
| 车票查询 / 购票 | `frontend/index.html` | 首页，查询车次、登录注册、选座购票 |
| 我的订单 | `frontend/orders.html` | 查看本人订单、退票 |

## 脚本结构

| 文件 | 职责 |
|------|------|
| `js/api.js` | 封装 `fetch` 请求、登录态（localStorage）读写、统一错误抛出、`toast` 提示 |
| `js/common.js` | 共享常量与工具，`SEAT_NAMES` / `seatName()` 座位类型映射 |
| `js/app.js` | 首页逻辑：车次查询渲染、登录注册、购票弹窗 |
| `js/orders.js` | 我的订单页逻辑：订单渲染、退票 |
| `css/style.css` | 全站样式，含响应式适配 |

## 数据流

1. 页面加载 → `DOMContentLoaded` → 渲染用户状态 → 默认查询全部车次。
2. 用户提交查询表单 → `searchTrains()` → `GET /api/trains` → 渲染车次卡片。
3. 点击「购票」→ 校验登录态 → 打开购票弹窗 → 提交 → `POST /api/orders` → 刷新列表。
4. 登录/注册 → `POST /api/auth/login` 或 `/register` → token 存入 localStorage。
5. 我的订单页 → `GET /api/orders/mine` → 渲染；退票 → `POST /api/orders/:id/cancel`。

## 关键事件

| 元素 | 事件 | 处理 |
|------|------|------|
| `#searchForm` | submit | 查询车次 |
| `#bookForm` | submit | 提交购票 |
| `#authForm` | submit | 登录或注册（按当前 tab） |
| `.modal` | click（遮罩） | 点击空白处关闭弹窗 |
| `#userBox` | click | 登录或退出 |

## 交互细节

- 查询期间显示「正在查询车次…」加载占位，失败显示错误占位。
- 售罄座位在车次卡片中置灰加删除线；整车售罄时购票按钮禁用。
- 退票前 `confirm` 二次确认。
- 购票数量支持 1–5 张，前端 `number` 输入框限制 min/max。

## 安全

- 所有需要身份的请求由 `api.js` 自动附带 `Authorization: Bearer <token>`。
- token 存于 localStorage，退出登录即清除。
- 后端做最终校验，前端校验仅用于体验，不作为安全边界。
