# 后端文档

后端基于 Node.js + Express，使用 JWT 认证、bcryptjs 密码加密、JSON 文件持久化。入口为 `backend/src/server.js`。

## 模块结构

| 文件 | 职责 |
|------|------|
| `src/server.js` | 应用入口，装配中间件、静态托管、路由、健康检查、统一 404/错误处理 |
| `src/db.js` | JSON 文件数据访问层，`load()` / `save()` / `genId()`，含种子数据 |
| `src/constants.js` | 座位类型常量 `SEAT_TYPES` / `SEAT_NAMES` |
| `src/middleware/auth.js` | JWT 签发 `sign()`、校验中间件 `auth`、管理员校验 `adminOnly` |
| `src/routes/auth.js` | 注册、登录 |
| `src/routes/trains.js` | 车次查询、详情 |
| `src/routes/orders.js` | 购票、我的订单、退票 |
| `src/routes/admin.js` | 车次增删改、订单总览、运营统计 |

## API 端点

### 认证 `/api/auth`

| 方法 | 路径 | 权限 | 请求体 | 说明 |
|------|------|------|--------|------|
| POST | `/register` | 公开 | `{username, password}` | 注册，密码≥6 位，用户名唯一 |
| POST | `/login` | 公开 | `{username, password}` | 登录，返回 `{token, username, role}` |

### 车次 `/api/trains`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | 公开 | 查询车次，支持 `from`/`to`/`date` 查询参数 |
| GET | `/:id` | 公开 | 车次详情 |

### 订单 `/api/orders`

| 方法 | 路径 | 权限 | 请求体 | 说明 |
|------|------|------|--------|------|
| POST | `/` | 登录 | `{trainId, seatType, passenger, quantity}` | 购票，数量 1–5，扣减库存 |
| GET | `/mine` | 登录 | — | 本人订单列表 |
| POST | `/:id/cancel` | 登录 | — | 退票，回补库存 |

### 管理 `/api/admin`（需管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/trains` | 新增车次，校验座位类型 |
| PUT | `/trains/:id` | 修改车次，保留已售数，校验总座位≥已售 |
| DELETE | `/trains/:id` | 删除车次 |
| GET | `/orders` | 全部订单 |
| GET | `/stats` | 运营统计：车次数、订单数、有效订单数、售出票数、营收 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查，返回 `{status:"ok"}` |

## 数据模型

```jsonc
// User
{ "id": "U...", "username": "string", "password": "bcrypt hash", "role": "user|admin" }

// Train
{
  "id": "T...", "trainNo": "G101",
  "from": "北京南", "to": "上海虹桥",
  "date": "2026-07-01", "departTime": "08:00", "arriveTime": "12:30",
  "seats": {
    "business": { "price": 1748, "total": 20, "sold": 0 },
    "first":    { "price": 933,  "total": 60, "sold": 0 },
    "second":   { "price": 553,  "total": 200, "sold": 0 }
  }
}

// Order
{
  "id": "O...", "userId": "U...", "trainId": "T...",
  "trainNo": "G101", "from": "北京南", "to": "上海虹桥",
  "date": "2026-07-01", "departTime": "08:00",
  "seatType": "second", "quantity": 2,
  "price": 553, "totalPrice": 1106,
  "passenger": "张三", "status": "paid|cancelled",
  "createdAt": "ISO 时间"
}
```

座位类型仅允许 `business` / `first` / `second`。

## 校验规则

- 注册：用户名、密码非空；密码≥6 位；用户名去首尾空格后唯一。
- 购票：车次/座位类型/乘客必填；数量 1–5；余票充足。
- 退票：仅本人、未退过的订单。
- 管理新增/修改车次：座位类型合法；修改时总座位数不得小于已售数。

## 错误格式

所有错误返回统一结构：

```json
{ "error": "错误描述" }
```

常见状态码：`400` 参数错误、`401` 未认证/凭证无效、`403` 权限不足、`404` 资源不存在、`409` 冲突（用户名已存在/余票不足）、`500` 服务器内部错误。

## 认证机制

- 登录签发 JWT（`HS256`，有效期 2 小时），载荷含 `id`、`username`、`role`。
- 受保护接口需请求头 `Authorization: Bearer <token>`。
- 管理接口在 `auth` 之后追加 `adminOnly` 校验角色。

## 配置

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `PORT` | 监听端口 | 3000 |
| `JWT_SECRET` | JWT 签名密钥 | dev-secret-change-me |
| `ADMIN_USERNAME` | 默认管理员账号 | admin |
| `ADMIN_PASSWORD` | 默认管理员密码 | admin123 |
| `DB_FILE` | 数据文件路径（测试隔离用） | src/data/db.json |
