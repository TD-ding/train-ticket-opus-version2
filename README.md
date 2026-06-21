# 易行火车票 · train-ticket-opus-version2

一个仿 12306 的火车票订购网站，包含**用户前端**、**管理后台**和 **REST 后端**，模拟车票查询、登录注册、购票、退票、车次管理与订单总览的完整流程。

## 技术栈

- **后端**：Node.js + Express，JWT 认证，bcryptjs 密码加密，JSON 文件持久化（零外部数据库依赖）
- **用户前端**：原生 HTML / CSS / JavaScript
- **管理后台**：原生 HTML / CSS / JavaScript
- **代码规范**：ESLint v9 flat config

## 功能概览

### 用户端（`/`）
- 按出发地、到达地、日期查询车次
- 注册 / 登录（JWT）
- 选座购票（商务座 / 一等座 / 二等座，实时余票）
- 查看我的订单、退票（自动回补库存）

### 管理后台（`/admin`）
- 管理员登录（默认 `admin / admin123`）
- 车次的新增、编辑、删除
- 全部订单总览

## 目录结构

```
train-ticket-opus-version2/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── server.js       # 应用入口，装配中间件与路由
│   │   ├── db.js           # JSON 文件数据访问层 + 种子数据
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT 签发 / 校验 / 管理员权限
│   │   └── routes/
│   │       ├── auth.js     # 注册、登录
│   │       ├── trains.js   # 车次查询
│   │       ├── orders.js   # 下单、我的订单、退票
│   │       └── admin.js    # 车次管理、订单总览
│   ├── eslint.config.js
│   └── package.json
├── frontend/               # 用户前端（静态页面）
│   ├── index.html          # 车票查询 + 购票
│   ├── orders.html         # 我的订单
│   ├── css/style.css
│   └── js/{api,app,orders}.js
├── admin/                  # 管理后台（静态页面）
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── docs/                   # 项目文档
│   ├── frontend.md         # 用户前端
│   ├── backend.md          # 后端 API
│   ├── admin-frontend.md   # 管理后台
│   └── deployment.md       # 部署
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .dockerignore
```

## 如何运行

```bash
cd backend
npm install
npm start          # 默认监听 3000 端口
```

然后访问：
- 用户端：http://localhost:3000/
- 管理后台：http://localhost:3000/admin/

> 后端通过 Express 静态托管同时对外提供前端与管理端页面，单进程即可运行整套系统。

### 使用 Docker

```bash
docker compose up --build      # 默认映射宿主机 3000 端口
```

更完整的部署说明见 [docs/deployment.md](docs/deployment.md)。

### 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `JWT_SECRET` | JWT 签名密钥 | dev-secret-change-me |
| `ADMIN_USERNAME` | 默认管理员账号 | admin |
| `ADMIN_PASSWORD` | 默认管理员密码 | admin123 |

## API 简表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 公开 |
| POST | `/api/auth/login` | 登录 | 公开 |
| GET | `/api/trains` | 查询车次 | 公开 |
| GET | `/api/trains/:id` | 车次详情 | 公开 |
| POST | `/api/orders` | 购票 | 登录 |
| GET | `/api/orders/mine` | 我的订单 | 登录 |
| POST | `/api/orders/:id/cancel` | 退票 | 登录 |
| POST | `/api/admin/trains` | 新增车次 | 管理员 |
| PUT | `/api/admin/trains/:id` | 修改车次 | 管理员 |
| DELETE | `/api/admin/trains/:id` | 删除车次 | 管理员 |
| GET | `/api/admin/orders` | 订单总览 | 管理员 |
| GET | `/api/admin/stats` | 运营统计 | 管理员 |

## 文档

- [用户前端文档](docs/frontend.md)
- [后端文档](docs/backend.md)
- [管理后台文档](docs/admin-frontend.md)
- [部署文档](docs/deployment.md)

## 许可证

MIT
